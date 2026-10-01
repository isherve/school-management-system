import { ExamStatus, ExamType, Prisma } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app.error.js';
import { getPaginationParams, buildPaginatedResult, calculateGrade } from '../../shared/utils/index.js';

export class ExamService {
  async findAll(schoolId: string, query: Record<string, unknown>) {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const classId = query.classId as string | undefined;
    const termId = query.termId as string | undefined;

    const where: Prisma.ExamWhereInput = {
      class: { schoolId },
      ...(classId && { classId }),
      ...(termId && { termId }),
    };

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          class: { select: { id: true, name: true, section: true } },
          subject: { select: { id: true, name: true, code: true } },
          term: { select: { id: true, name: true } },
          _count: { select: { results: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return buildPaginatedResult(exams, total, page, limit);
  }

  async create(data: {
    classId: string;
    subjectId: string;
    termId?: string;
    name: string;
    type: ExamType;
    totalMarks: number;
    passMarks: number;
    examDate?: string;
    duration?: number;
  }) {
    return prisma.exam.create({
      data: {
        ...data,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
        status: 'DRAFT',
      },
      include: { class: true, subject: true },
    });
  }

  async enterMarks(examId: string, marks: { studentId: string; marksObtained: number; remarks?: string }[]) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { class: { include: { school: true } } },
    });
    if (!exam) throw new NotFoundError('Exam');

    const gradingSystem = await prisma.gradingSystem.findMany({
      where: { schoolId: exam.class.schoolId },
      orderBy: { minScore: 'desc' },
    });

    const results = await Promise.all(
      marks.map(async (m) => {
        const grade = calculateGrade(
          m.marksObtained,
          gradingSystem.map((g) => ({
            minScore: Number(g.minScore),
            maxScore: Number(g.maxScore),
            grade: g.grade,
          }))
        );
        return prisma.examResult.upsert({
          where: { examId_studentId: { examId, studentId: m.studentId } },
          create: {
            examId,
            studentId: m.studentId,
            marksObtained: m.marksObtained,
            grade,
            remarks: m.remarks,
          },
          update: {
            marksObtained: m.marksObtained,
            grade,
            remarks: m.remarks,
          },
        });
      })
    );

    // Calculate ranks
    const allResults = await prisma.examResult.findMany({
      where: { examId },
      orderBy: { marksObtained: 'desc' },
    });

    await Promise.all(
      allResults.map((r, index) =>
        prisma.examResult.update({
          where: { id: r.id },
          data: { rank: index + 1 },
        })
      )
    );

    return results;
  }

  async publishResults(examId: string) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError('Exam');

    const resultCount = await prisma.examResult.count({ where: { examId } });
    if (resultCount === 0) throw new ValidationError('No results to publish');

    return prisma.exam.update({
      where: { id: examId },
      data: { status: 'PUBLISHED' as ExamStatus, isPublished: true },
    });
  }

  async getMeritList(examId: string, limit = 10) {
    return prisma.examResult.findMany({
      where: { examId },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true, section: true } },
          },
        },
      },
    });
  }

  async getPerformanceAnalysis(examId: string) {
    const results = await prisma.examResult.findMany({
      where: { examId },
      include: { student: true },
    });

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundError('Exam');

    const scores = results.map((r) => Number(r.marksObtained));
    const total = scores.length;
    const average = total ? scores.reduce((a, b) => a + b, 0) / total : 0;
    const highest = total ? Math.max(...scores) : 0;
    const lowest = total ? Math.min(...scores) : 0;
    const passed = results.filter((r) => Number(r.marksObtained) >= Number(exam.passMarks)).length;

    const gradeDistribution = results.reduce(
      (acc, r) => {
        const grade = r.grade || 'N/A';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalStudents: total,
      average: Math.round(average * 100) / 100,
      highest,
      lowest,
      passRate: total ? Math.round((passed / total) * 100) : 0,
      gradeDistribution,
    };
  }
}

export const examService = new ExamService();

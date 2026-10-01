import { AttendanceMethod, AttendanceStatus, Prisma } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app.error.js';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/index.js';

export class AttendanceService {
  async markClassAttendance(
    classId: string,
    schoolId: string,
    date: string,
    records: { studentId: string; status: AttendanceStatus; remarks?: string }[],
    markedBy?: string,
    method: AttendanceMethod = 'MANUAL'
  ) {
    const classRecord = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!classRecord) throw new NotFoundError('Class');

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      records.map((r) =>
        prisma.attendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date: attendanceDate } },
          create: {
            studentId: r.studentId,
            classId,
            date: attendanceDate,
            status: r.status,
            method,
            remarks: r.remarks,
            markedBy,
            checkIn: r.status === 'PRESENT' || r.status === 'LATE' ? new Date() : undefined,
          },
          update: {
            status: r.status,
            method,
            remarks: r.remarks,
            markedBy,
          },
        })
      )
    );

    return results;
  }

  async getClassAttendance(classId: string, schoolId: string, date: string) {
    const classRecord = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!classRecord) throw new NotFoundError('Class');

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const [students, attendances] = await Promise.all([
      prisma.student.findMany({
        where: { classId, schoolId, isActive: true },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { admissionNumber: 'asc' },
      }),
      prisma.attendance.findMany({
        where: { classId, date: attendanceDate },
      }),
    ]);

    const attendanceMap = Object.fromEntries(attendances.map((a) => [a.studentId, a]));

    return students.map((s) => ({
      student: s,
      attendance: attendanceMap[s.id] || null,
    }));
  }

  async getReport(schoolId: string, query: Record<string, unknown>) {
    const classId = query.classId as string | undefined;
    const from = query.from ? new Date(String(query.from)) : new Date(new Date().setDate(1));
    const to = query.to ? new Date(String(query.to)) : new Date();

    const where: Prisma.AttendanceWhereInput = {
      student: { schoolId },
      date: { gte: from, lte: to },
      ...(classId && { classId }),
    };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true, section: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const summary = records.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { records, summary, total: records.length };
  }

  async getDailyStats(schoolId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const [present, absent, late, totalStudents] = await Promise.all([
      prisma.attendance.count({
        where: { student: { schoolId }, date: targetDate, status: 'PRESENT' },
      }),
      prisma.attendance.count({
        where: { student: { schoolId }, date: targetDate, status: 'ABSENT' },
      }),
      prisma.attendance.count({
        where: { student: { schoolId }, date: targetDate, status: 'LATE' },
      }),
      prisma.student.count({ where: { schoolId, isActive: true } }),
    ]);

    const marked = present + absent + late;
    return {
      date: targetDate,
      present,
      absent,
      late,
      unmarked: Math.max(0, totalStudents - marked),
      totalStudents,
      rate: totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0,
    };
  }

  async getStudentHistory(studentId: string, schoolId: string, limit = 30) {
    const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
    if (!student) throw new NotFoundError('Student');

    return prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}

export const attendanceService = new AttendanceService();

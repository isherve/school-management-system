import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ConflictError } from '../../shared/errors/app.error.js';

export class AcademicsService {
  // Departments
  async getDepartments(schoolId: string) {
    return prisma.department.findMany({
      where: { schoolId },
      include: { _count: { select: { subjects: true, teachers: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(schoolId: string, data: { name: string; code: string; description?: string }) {
    return prisma.department.create({ data: { schoolId, ...data } });
  }

  // Classes
  async getClasses(schoolId: string) {
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });

    return prisma.class.findMany({
      where: { schoolId, ...(currentYear && { academicYearId: currentYear.id }) },
      include: {
        _count: { select: { students: true } },
        subjects: { include: { subject: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createClass(
    schoolId: string,
    data: { name: string; section?: string; capacity?: number; academicYearId?: string; room?: string }
  ) {
    let academicYearId = data.academicYearId;
    if (!academicYearId) {
      const current = await prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
      if (!current) throw new NotFoundError('Active academic year');
      academicYearId = current.id;
    }

    return prisma.class.create({
      data: {
        schoolId,
        academicYearId,
        name: data.name,
        section: data.section,
        capacity: data.capacity || 40,
        room: data.room,
      },
    });
  }

  // Subjects
  async getSubjects(schoolId: string) {
    return prisma.subject.findMany({
      where: { schoolId },
      include: { department: { select: { name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createSubject(
    schoolId: string,
    data: {
      name: string;
      code: string;
      departmentId?: string;
      description?: string;
      creditHours?: number;
      isElective?: boolean;
    }
  ) {
    return prisma.subject.create({ data: { schoolId, ...data } });
  }

  async assignSubjectToClass(classId: string, subjectId: string, teacherId?: string) {
    const existing = await prisma.classSubject.findUnique({
      where: { classId_subjectId: { classId, subjectId } },
    });
    if (existing) throw new ConflictError('Subject already assigned to class');

    return prisma.classSubject.create({
      data: { classId, subjectId, teacherId },
      include: { subject: true },
    });
  }

  async getClassSubjects(classId: string) {
    return prisma.classSubject.findMany({
      where: { classId },
      include: { subject: true },
    });
  }

  async getOverview(schoolId: string) {
    const [departments, classes, subjects, students] = await Promise.all([
      prisma.department.count({ where: { schoolId } }),
      prisma.class.count({ where: { schoolId } }),
      prisma.subject.count({ where: { schoolId } }),
      prisma.student.count({ where: { schoolId, isActive: true } }),
    ]);

    return { departments, classes, subjects, students };
  }
}

export const academicsService = new AcademicsService();

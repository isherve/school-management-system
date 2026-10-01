import { Gender, Prisma } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ConflictError } from '../../shared/errors/app.error.js';
import {
  getPaginationParams,
  buildPaginatedResult,
  generateAdmissionNumber,
} from '../../shared/utils/index.js';

export class StudentService {
  async findAll(schoolId: string, query: Record<string, unknown>) {
    const { page, limit, sortBy, sortOrder, search } = getPaginationParams(query);
    const classId = query.classId as string | undefined;
    const isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined;

    const where: Prisma.StudentWhereInput = {
      schoolId,
      ...(classId && { classId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { admissionNumber: { contains: search } },
          { user: { firstName: { contains: search } } },
          { user: { lastName: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              status: true,
            },
          },
          class: { select: { id: true, name: true, section: true } },
          guardians: {
            include: {
              parent: {
                include: {
                  user: { select: { firstName: true, lastName: true, phone: true, email: true } },
                },
              },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return buildPaginatedResult(students, total, page, limit);
  }

  async findById(id: string, schoolId: string) {
    const student = await prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        user: true,
        class: true,
        medicalInfo: true,
        emergencyContacts: true,
        documents: true,
        guardians: {
          include: {
            parent: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
          },
        },
        attendances: { take: 30, orderBy: { date: 'desc' } },
        examResults: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { exam: { include: { subject: true } } },
        },
      },
    });

    if (!student) throw new NotFoundError('Student');
    const { user, ...rest } = student;
    const { password: _, ...safeUser } = user;
    return { ...rest, user: safeUser };
  }

  async create(schoolId: string, data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    classId?: string;
    dateOfBirth?: string;
    gender?: Gender;
    phone?: string;
    address?: string;
    guardians?: { parentEmail: string; relationship: string; isPrimary?: boolean }[];
  }) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundError('School');

    const count = await prisma.student.count({ where: { schoolId } });
    const admissionNumber = generateAdmissionNumber(school.code, count + 1);

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'STUDENT',
          schoolId,
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          schoolId,
          classId: data.classId,
          admissionNumber,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender,
          address: data.address,
          qrCode: `STU-${admissionNumber}`,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          class: true,
        },
      });

      return student;
    });
  }

  async update(id: string, schoolId: string, data: Partial<{
    classId: string;
    dateOfBirth: string;
    gender: Gender;
    address: string;
    isActive: boolean;
    firstName: string;
    lastName: string;
    phone: string;
  }>) {
    const student = await prisma.student.findFirst({ where: { id, schoolId } });
    if (!student) throw new NotFoundError('Student');

    const { firstName, lastName, phone, ...studentData } = data;

    if (firstName || lastName || phone) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { firstName, lastName, phone },
      });
    }

    return prisma.student.update({
      where: { id },
      data: {
        ...studentData,
        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : undefined,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        class: true,
      },
    });
  }

  async promote(id: string, schoolId: string, toClassId: string, academicYear: string) {
    const student = await prisma.student.findFirst({ where: { id, schoolId } });
    if (!student) throw new NotFoundError('Student');

    return prisma.$transaction(async (tx) => {
      await tx.studentPromotion.create({
        data: {
          studentId: id,
          fromClassId: student.classId,
          toClassId,
          academicYear,
        },
      });

      return tx.student.update({
        where: { id },
        data: { classId: toClassId },
        include: { class: true },
      });
    });
  }

  async getStats(schoolId: string) {
    const [total, active, byGender, byClass] = await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.student.count({ where: { schoolId, isActive: true } }),
      prisma.student.groupBy({
        by: ['gender'],
        where: { schoolId, isActive: true },
        _count: true,
      }),
      prisma.student.groupBy({
        by: ['classId'],
        where: { schoolId, isActive: true },
        _count: true,
      }),
    ]);

    return { total, active, inactive: total - active, byGender, byClass };
  }
}

export const studentService = new StudentService();

import { Prisma } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError } from '../../shared/errors/app.error.js';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/index.js';

export class TeacherService {
  async findAll(schoolId: string, query: Record<string, unknown>) {
    const { page, limit, sortBy, sortOrder, search } = getPaginationParams(query);
    const departmentId = query.departmentId as string | undefined;

    const where: Prisma.TeacherWhereInput = {
      schoolId,
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { employeeId: { contains: search } },
          { user: { firstName: { contains: search } } },
          { user: { lastName: { contains: search } } },
        ],
      }),
    };

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
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
          department: { select: { id: true, name: true, code: true } },
          subjects: { include: { subject: true } },
        },
      }),
      prisma.teacher.count({ where }),
    ]);

    return buildPaginatedResult(teachers, total, page, limit);
  }

  async findById(id: string, schoolId: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId },
      include: {
        user: true,
        department: true,
        subjects: { include: { subject: true } },
        lessonPlans: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!teacher) throw new NotFoundError('Teacher');
    const { user, ...rest } = teacher;
    const { password: _, ...safeUser } = user;
    return { ...rest, user: safeUser };
  }

  async create(schoolId: string, data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    departmentId?: string;
    qualification?: string;
    specialization?: string;
    salary?: number;
    phone?: string;
  }) {
    const count = await prisma.teacher.count({ where: { schoolId } });
    const employeeId = `TCH-${String(count + 1).padStart(5, '0')}`;

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
          role: 'TEACHER',
          schoolId,
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      return tx.teacher.create({
        data: {
          userId: user.id,
          schoolId,
          departmentId: data.departmentId,
          employeeId,
          qualification: data.qualification,
          specialization: data.specialization,
          salary: data.salary,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          department: true,
        },
      });
    });
  }

  async getStats(schoolId: string) {
    const [total, active, byDepartment] = await Promise.all([
      prisma.teacher.count({ where: { schoolId } }),
      prisma.teacher.count({ where: { schoolId, isActive: true } }),
      prisma.teacher.groupBy({
        by: ['departmentId'],
        where: { schoolId, isActive: true },
        _count: true,
      }),
    ]);

    return { total, active, inactive: total - active, byDepartment };
  }
}

export const teacherService = new TeacherService();

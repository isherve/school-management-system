import { UserRole, UserStatus, Prisma, AccountRequestStatus, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../../infrastructure/database/prisma.client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/app.error.js';
import { getPaginationParams, buildPaginatedResult } from '../../shared/utils/index.js';
import { sendEmail } from '../../infrastructure/email/email.service.js';

export class UserService {
  async findAll(schoolId: string, query: Record<string, unknown>) {
    const { page, limit, sortBy, sortOrder, search } = getPaginationParams(query);
    const role = query.role as UserRole | undefined;

    const where: Prisma.UserWhereInput = {
      schoolId,
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(users, total, page, limit);
  }

  async create(schoolId: string, data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    classId?: string;
    departmentId?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: data.role,
          schoolId,
          status: 'ACTIVE',
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      });

      if (data.role === 'STUDENT') {
        const school = await tx.school.findUnique({ where: { id: schoolId } });
        const count = await tx.student.count({ where: { schoolId } });
        await tx.student.create({
          data: {
            userId: user.id,
            schoolId,
            classId: data.classId,
            admissionNumber: `${school?.code || 'SCH'}/2026/${String(count + 1).padStart(4, '0')}`,
            admissionDate: new Date(),
          },
        });
      } else if (data.role === 'TEACHER') {
        const count = await tx.teacher.count({ where: { schoolId } });
        await tx.teacher.create({
          data: {
            userId: user.id,
            schoolId,
            departmentId: data.departmentId,
            employeeId: `TCH-${String(count + 1).padStart(4, '0')}`,
          },
        });
      } else if (data.role === 'PARENT') {
        await tx.parent.create({ data: { userId: user.id } });
      }

      return user;
    });
  }

  async update(id: string, schoolId: string, data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
  }>) {
    const user = await prisma.user.findFirst({ where: { id, schoolId } });
    if (!user) throw new NotFoundError('User');

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
      },
    });
  }

  async resetPassword(id: string, schoolId: string, newPassword: string) {
    const user = await prisma.user.findFirst({ where: { id, schoolId } });
    if (!user) throw new NotFoundError('User');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    return { message: 'Password updated successfully' };
  }

  async getAccountRequests(schoolId: string, status?: AccountRequestStatus) {
    return prisma.accountRequest.findMany({
      where: { schoolId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async approveAccountRequest(
    id: string,
    schoolId: string,
    reviewerId: string,
    options?: { classId?: string; password?: string }
  ) {
    const request = await prisma.accountRequest.findFirst({
      where: { id, schoolId, status: AccountRequestStatus.PENDING },
    });
    if (!request) throw new NotFoundError('Account request');

    const existing = await prisma.user.findUnique({ where: { email: request.email } });
    if (existing) throw new ConflictError('An account with this email already exists');

    const nameParts = request.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    const roleMap: Record<string, UserRole> = {
      Student: UserRole.STUDENT,
      Teacher: UserRole.TEACHER,
      Parent: UserRole.PARENT,
      'Staff Member': UserRole.RECEPTIONIST,
    };
    const role = roleMap[request.position] || UserRole.STUDENT;
    const password = options?.password || 'Admin@123';

    const user = await this.create(schoolId, {
      email: request.email,
      password,
      firstName,
      lastName,
      role,
      phone: request.phone,
      classId: options?.classId,
    });

    if (role === UserRole.STUDENT) {
      const gender: Gender | undefined =
        request.gender === 'Male' ? Gender.MALE : request.gender === 'Female' ? Gender.FEMALE : undefined;

      await prisma.student.update({
        where: { userId: user.id },
        data: {
          admissionNumber: request.regNo,
          gender,
          dateOfBirth: request.dateOfBirth,
          admissionDate: request.admissionDate,
        },
      });
    }

    await prisma.accountRequest.update({
      where: { id },
      data: {
        status: AccountRequestStatus.APPROVED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        createdUserId: user.id,
      },
    });

    await sendEmail({
      to: request.email,
      subject: 'Account approved — EduSMS',
      html: `<p>Dear ${request.name},</p><p>Your account request has been approved. You can now sign in with:</p><p><strong>Email:</strong> ${request.email}<br><strong>Password:</strong> ${password}</p><p>Please change your password after your first login.</p>`,
    });

    return user;
  }

  async rejectAccountRequest(id: string, schoolId: string, reviewerId: string, reason?: string) {
    const request = await prisma.accountRequest.findFirst({
      where: { id, schoolId, status: AccountRequestStatus.PENDING },
    });
    if (!request) throw new NotFoundError('Account request');

    await prisma.accountRequest.update({
      where: { id },
      data: {
        status: AccountRequestStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
    });

    await sendEmail({
      to: request.email,
      subject: 'Account request update — EduSMS',
      html: `<p>Dear ${request.name},</p><p>Your account request was not approved at this time.${reason ? ` Reason: ${reason}` : ''}</p><p>Contact the school administration if you have questions.</p>`,
    });

    return { message: 'Account request rejected' };
  }
}

export const userService = new UserService();

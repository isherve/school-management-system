import { TermStatus, UserRole } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError } from '../../shared/errors/app.error.js';

export class SettingsService {
  async getSchool(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        academicYears: {
          include: { terms: true },
          orderBy: { startDate: 'desc' },
        },
      },
    });
    if (!school) throw new NotFoundError('School');
    return school;
  }

  async updateSchool(
    schoolId: string,
    data: Partial<{
      name: string;
      motto: string;
      address: string;
      city: string;
      phone: string;
      email: string;
      website: string;
      timezone: string;
      currency: string;
      language: string;
    }>
  ) {
    return prisma.school.update({ where: { id: schoolId }, data });
  }

  async getAcademicYears(schoolId: string) {
    return prisma.academicYear.findMany({
      where: { schoolId },
      include: { terms: true, _count: { select: { classes: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async createAcademicYear(
    schoolId: string,
    data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }
  ) {
    if (data.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return prisma.academicYear.create({
      data: {
        schoolId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isCurrent: data.isCurrent ?? false,
      },
    });
  }

  async createTerm(
    academicYearId: string,
    data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }
  ) {
    if (data.isCurrent) {
      await prisma.term.updateMany({
        where: { academicYearId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return prisma.term.create({
      data: {
        academicYearId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'UPCOMING' as TermStatus,
        isCurrent: data.isCurrent ?? false,
      },
    });
  }

  async getGradingSystem(schoolId: string) {
    return prisma.gradingSystem.findMany({
      where: { schoolId },
      orderBy: { minScore: 'desc' },
    });
  }

  async createGrade(
    schoolId: string,
    data: {
      name: string;
      minScore: number;
      maxScore: number;
      grade: string;
      gradePoint?: number;
      remarks?: string;
    }
  ) {
    return prisma.gradingSystem.create({ data: { schoolId, ...data } });
  }

  async getSetting(schoolId: string, key: string) {
    return prisma.schoolSetting.findUnique({
      where: { schoolId_key: { schoolId, key } },
    });
  }

  async upsertSetting(schoolId: string, key: string, value: unknown) {
    return prisma.schoolSetting.upsert({
      where: { schoolId_key: { schoolId, key } },
      create: { schoolId, key, value: value as object },
      update: { value: value as object },
    });
  }
}

export class CommunicationService {
  async getAnnouncements(schoolId: string, limit = 20) {
    return prisma.announcement.findMany({
      where: { schoolId },
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async createAnnouncement(
    schoolId: string,
    authorId: string,
    data: {
      title: string;
      content: string;
      targetRoles?: UserRole[];
      isPinned?: boolean;
      expiresAt?: string;
    }
  ) {
    const roles = data.targetRoles || [UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT];
    return prisma.announcement.create({
      data: {
        schoolId,
        authorId,
        title: data.title,
        content: data.content,
        targetRoles: roles.join(','),
        isPinned: data.isPinned ?? false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
  }

  async getMessages(userId: string, type: 'inbox' | 'sent' = 'inbox') {
    return prisma.message.findMany({
      where: type === 'inbox' ? { receiverId: userId } : { senderId: userId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async sendMessage(senderId: string, data: { receiverId: string; subject?: string; content: string }) {
    return prisma.message.create({
      data: { senderId, ...data },
      include: {
        receiver: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getNotifications(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly && { isRead: false }) },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markNotificationRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async updateAnnouncement(
    id: string,
    schoolId: string,
    data: Partial<{ title: string; content: string; isPinned: boolean; expiresAt: string | null }>
  ) {
    const existing = await prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundError('Announcement');

    return prisma.announcement.update({
      where: { id },
      data: {
        ...data,
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
      },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
  }

  async deleteAnnouncement(id: string, schoolId: string) {
    const existing = await prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundError('Announcement');
    await prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted' };
  }
}

export const settingsService = new SettingsService();
export const communicationService = new CommunicationService();

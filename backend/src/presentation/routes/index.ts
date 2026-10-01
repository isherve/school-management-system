import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentRoutes from './student.routes.js';
import teacherRoutes from './teacher.routes.js';
import examRoutes from './exam.routes.js';
import financeRoutes from './finance.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import attendanceRoutes from './attendance.routes.js';
import academicsRoutes from './academics.routes.js';
import settingsRoutes from './settings.routes.js';
import communicationRoutes from './communication.routes.js';
import libraryRoutes from './library.routes.js';
import modulesRoutes from './modules.routes.js';
import filesRoutes from './files.routes.js';
import userRoutes from './user.routes.js';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { UserRole } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'SMS API is running', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/exams', examRoutes);
router.use('/finance', financeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/academics', academicsRoutes);
router.use('/settings', settingsRoutes);
router.use('/communication', communicationRoutes);
router.use('/library', libraryRoutes);
router.use('/users', userRoutes);
router.use('/modules', modulesRoutes);
router.use('/files', filesRoutes);
router.use('/', dashboardRoutes);

router.get(
  '/audit-logs',
  authenticate,
  requireSchool,
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL),
  getAuditLogs
);

// Global search
router.get(
  '/search',
  authenticate,
  requireSchool,
  asyncHandler(async (req, res) => {
    const schoolId = req.user!.schoolId!;
    const q = String(req.query.q || '');
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { students: [], teachers: [], books: [], invoices: [] } });
    }

    const [students, teachers, books, invoices] = await Promise.all([
      prisma.student.findMany({
        where: {
          schoolId,
          OR: [
            { admissionNumber: { contains: q } },
            { user: { firstName: { contains: q } } },
            { user: { lastName: { contains: q } } },
          ],
        },
        take: 5,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.teacher.findMany({
        where: {
          schoolId,
          OR: [
            { employeeId: { contains: q } },
            { user: { firstName: { contains: q } } },
          ],
        },
        take: 5,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.libraryBook.findMany({
        where: { schoolId, title: { contains: q } },
        take: 5,
      }),
      prisma.feeInvoice.findMany({
        where: {
          student: { schoolId },
          invoiceNumber: { contains: q },
        },
        take: 5,
      }),
    ]);

    res.json({ success: true, data: { students, teachers, books, invoices } });
  })
);

export default router;

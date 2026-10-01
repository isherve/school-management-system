import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { attendanceService } from '../../application/services/attendance.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';
import { STAFF_ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticate, requireSchool);

router.get(
  '/stats',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const stats = await attendanceService.getDailyStats(req.user!.schoolId!, req.query.date as string);
    res.json({ success: true, data: stats });
  })
);

router.get(
  '/report',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const report = await attendanceService.getReport(req.user!.schoolId!, req.query as Record<string, unknown>);
    res.json({ success: true, data: report });
  })
);

router.get(
  '/class/:classId',
  authorize(...STAFF_ROLES, UserRole.CLASS_TEACHER),
  asyncHandler(async (req, res) => {
    const data = await attendanceService.getClassAttendance(
      getRouteParam(req.params.classId),
      req.user!.schoolId!,
      String(req.query.date || new Date().toISOString().split('T')[0])
    );
    res.json({ success: true, data });
  })
);

router.post(
  '/class/:classId',
  authorize(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL),
  [
    body('date').notEmpty(),
    body('records').isArray({ min: 1 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const results = await attendanceService.markClassAttendance(
      getRouteParam(req.params.classId),
      req.user!.schoolId!,
      req.body.date,
      req.body.records,
      req.user!.userId,
      req.body.method
    );
    res.json({ success: true, data: results, message: 'Attendance marked successfully' });
  })
);

router.get(
  '/student/:studentId',
  authorize(...STAFF_ROLES, UserRole.PARENT, UserRole.STUDENT),
  asyncHandler(async (req, res) => {
    const history = await attendanceService.getStudentHistory(
      getRouteParam(req.params.studentId),
      req.user!.schoolId!
    );
    res.json({ success: true, data: history });
  })
);

export default router;

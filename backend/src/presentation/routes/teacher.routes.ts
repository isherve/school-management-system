import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { teacherService } from '../../application/services/teacher.service.js';
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
    const stats = await teacherService.getStats(req.user!.schoolId!);
    res.json({ success: true, data: stats });
  })
);

router.get(
  '/',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const result = await teacherService.findAll(req.user!.schoolId!, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  })
);

router.get(
  '/:id',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const teacher = await teacherService.findById(getRouteParam(req.params.id), req.user!.schoolId!);
    res.json({ success: true, data: teacher });
  })
);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.HR_OFFICER),
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const teacher = await teacherService.create(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: teacher });
  })
);

export default router;

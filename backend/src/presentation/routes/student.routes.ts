import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { studentService } from '../../application/services/student.service.js';
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
    const stats = await studentService.getStats(req.user!.schoolId!);
    res.json({ success: true, data: stats });
  })
);

router.get(
  '/',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const result = await studentService.findAll(req.user!.schoolId!, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  })
);

router.get(
  '/:id',
  authorize(...STAFF_ROLES, UserRole.PARENT, UserRole.STUDENT),
  asyncHandler(async (req, res) => {
    const student = await studentService.findById(getRouteParam(req.params.id), req.user!.schoolId!);
    res.json({ success: true, data: student });
  })
);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.REGISTRAR),
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('guardians').optional().isArray(),
    body('guardians.*.parentEmail').optional().isEmail().normalizeEmail(),
    body('guardians.*.relationship').optional().trim().notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const student = await studentService.create(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: student });
  })
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.REGISTRAR),
  asyncHandler(async (req, res) => {
    const student = await studentService.update(getRouteParam(req.params.id), req.user!.schoolId!, req.body);
    res.json({ success: true, data: student });
  })
);

router.post(
  '/:id/promote',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL),
  [body('toClassId').notEmpty(), body('academicYear').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const student = await studentService.promote(
      getRouteParam(req.params.id),
      req.user!.schoolId!,
      req.body.toClassId,
      req.body.academicYear
    );
    res.json({ success: true, data: student });
  })
);

export default router;

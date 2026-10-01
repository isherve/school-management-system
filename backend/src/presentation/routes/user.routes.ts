import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole, AccountRequestStatus } from '@prisma/client';
import { userService } from '../../application/services/user.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';

const router = Router();

router.use(authenticate, requireSchool);

router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL),
  asyncHandler(async (req, res) => {
    const result = await userService.findAll(req.user!.schoolId!, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
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
    body('role').notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const user = await userService.create(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  })
);

router.get(
  '/account-requests',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.REGISTRAR),
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const requests = await userService.getAccountRequests(
      req.user!.schoolId!,
      status as AccountRequestStatus | undefined
    );
    res.json({ success: true, data: requests });
  })
);

router.post(
  '/account-requests/:id/approve',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.REGISTRAR),
  asyncHandler(async (req, res) => {
    const user = await userService.approveAccountRequest(
      getRouteParam(req.params.id),
      req.user!.schoolId!,
      req.user!.userId,
      {
        classId: req.body.classId,
        password: req.body.password,
        studentIds: req.body.studentIds,
        guardianRelationship: req.body.guardianRelationship,
      }
    );
    res.json({ success: true, data: user, message: 'Account request approved and user created' });
  })
);

router.post(
  '/account-requests/:id/reject',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.REGISTRAR),
  asyncHandler(async (req, res) => {
    const result = await userService.rejectAccountRequest(
      getRouteParam(req.params.id),
      req.user!.schoolId!,
      req.user!.userId,
      req.body.reason
    );
    res.json({ success: true, ...result });
  })
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL),
  asyncHandler(async (req, res) => {
    const user = await userService.update(getRouteParam(req.params.id), req.user!.schoolId!, req.body);
    res.json({ success: true, data: user });
  })
);

router.post(
  '/:id/reset-password',
  authorize(UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER),
  [body('password').isLength({ min: 8 })],
  validate,
  asyncHandler(async (req, res) => {
    const result = await userService.resetPassword(getRouteParam(req.params.id), req.user!.schoolId!, req.body.password);
    res.json({ success: true, ...result });
  })
);

export default router;

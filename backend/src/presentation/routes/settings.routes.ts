import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { settingsService } from '../../application/services/settings.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';
import { STAFF_ROLES } from '../../shared/constants/roles.js';
import { isEmailConfigured } from '../../infrastructure/email/email.service.js';
import { config } from '../../config/index.js';

const router = Router();

router.use(authenticate, requireSchool);

router.get('/school', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  const school = await settingsService.getSchool(req.user!.schoolId!);
  res.json({ success: true, data: school });
}));

router.get('/integrations', authorize(...STAFF_ROLES), asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      emailConfigured: isEmailConfigured(),
      smtpHost: config.email.host,
      smtpPort: config.email.port,
      emailFrom: config.email.from,
      loginOtpEnabled: true,
      devCodeOnScreen: config.env === 'development' && !isEmailConfigured(),
    },
  });
}));

router.put(
  '/school',
  authorize(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const school = await settingsService.updateSchool(req.user!.schoolId!, req.body);
    res.json({ success: true, data: school });
  })
);

router.get('/academic-years', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  const years = await settingsService.getAcademicYears(req.user!.schoolId!);
  res.json({ success: true, data: years });
}));

router.post(
  '/academic-years',
  authorize(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL),
  [body('name').notEmpty(), body('startDate').notEmpty(), body('endDate').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const year = await settingsService.createAcademicYear(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: year });
  })
);

router.post(
  '/academic-years/:yearId/terms',
  authorize(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL),
  [body('name').notEmpty(), body('startDate').notEmpty(), body('endDate').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const term = await settingsService.createTerm(getRouteParam(req.params.yearId), req.body);
    res.status(201).json({ success: true, data: term });
  })
);

router.get('/grading', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  const grades = await settingsService.getGradingSystem(req.user!.schoolId!);
  res.json({ success: true, data: grades });
}));

router.post(
  '/grading',
  authorize(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL),
  [body('name').notEmpty(), body('minScore').isNumeric(), body('maxScore').isNumeric(), body('grade').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const grade = await settingsService.createGrade(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: grade });
  })
);

export default router;

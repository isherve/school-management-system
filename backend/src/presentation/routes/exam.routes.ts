import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { examService } from '../../application/services/exam.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';

const router = Router();

router.use(authenticate, requireSchool);

router.get(
  '/',
  authorize(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_OWNER),
  asyncHandler(async (req, res) => {
    const result = await examService.findAll(req.user!.schoolId!, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/',
  authorize(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL),
  [
    body('classId').notEmpty(),
    body('subjectId').notEmpty(),
    body('name').trim().notEmpty(),
    body('type').notEmpty(),
    body('totalMarks').isNumeric(),
    body('passMarks').isNumeric(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const exam = await examService.create(req.body);
    res.status(201).json({ success: true, data: exam });
  })
);

router.post(
  '/:id/marks',
  authorize(UserRole.TEACHER, UserRole.CLASS_TEACHER),
  [body('marks').isArray({ min: 1 })],
  validate,
  asyncHandler(async (req, res) => {
    const results = await examService.enterMarks(getRouteParam(req.params.id), req.body.marks);
    res.json({ success: true, data: results });
  })
);

router.post(
  '/:id/publish',
  authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.CLASS_TEACHER),
  asyncHandler(async (req, res) => {
    const exam = await examService.publishResults(getRouteParam(req.params.id));
    res.json({ success: true, data: exam });
  })
);

router.get(
  '/:id/merit-list',
  authorize(UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.PARENT, UserRole.STUDENT),
  asyncHandler(async (req, res) => {
    const meritList = await examService.getMeritList(getRouteParam(req.params.id));
    res.json({ success: true, data: meritList });
  })
);

router.get(
  '/:id/analysis',
  authorize(UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL),
  asyncHandler(async (req, res) => {
    const analysis = await examService.getPerformanceAnalysis(getRouteParam(req.params.id));
    res.json({ success: true, data: analysis });
  })
);

export default router;

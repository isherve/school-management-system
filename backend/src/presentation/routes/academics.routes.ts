import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { academicsService } from '../../application/services/academics.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';
import { STAFF_ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticate, requireSchool);

router.get(
  '/overview',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const overview = await academicsService.getOverview(req.user!.schoolId!);
    res.json({ success: true, data: overview });
  })
);

router.get('/departments', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  const data = await academicsService.getDepartments(req.user!.schoolId!);
  res.json({ success: true, data });
}));

router.post(
  '/departments',
  authorize(UserRole.PRINCIPAL, UserRole.SCHOOL_OWNER, UserRole.VICE_PRINCIPAL),
  [body('name').notEmpty(), body('code').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const dept = await academicsService.createDepartment(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: dept });
  })
);

router.get('/classes', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  const data = await academicsService.getClasses(req.user!.schoolId!);
  res.json({ success: true, data });
}));

router.post(
  '/classes',
  authorize(UserRole.PRINCIPAL, UserRole.REGISTRAR, UserRole.SCHOOL_OWNER),
  [body('name').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const cls = await academicsService.createClass(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: cls });
  })
);

router.get('/subjects', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  const data = await academicsService.getSubjects(req.user!.schoolId!);
  res.json({ success: true, data });
}));

router.post(
  '/subjects',
  authorize(UserRole.PRINCIPAL, UserRole.SCHOOL_OWNER),
  [body('name').notEmpty(), body('code').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const subject = await academicsService.createSubject(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: subject });
  })
);

router.get('/classes/:classId/subjects', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  const data = await academicsService.getClassSubjects(getRouteParam(req.params.classId));
  res.json({ success: true, data });
}));

router.post(
  '/classes/:classId/subjects',
  authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL),
  [body('subjectId').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const data = await academicsService.assignSubjectToClass(
      getRouteParam(req.params.classId),
      req.body.subjectId,
      req.body.teacherId
    );
    res.status(201).json({ success: true, data });
  })
);

export default router;

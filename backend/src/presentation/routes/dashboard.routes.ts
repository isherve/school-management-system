import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import {
  dashboardService,
  parentPortalService,
  studentPortalService,
  aiService,
} from '../../application/services/dashboard.service.js';
import { aiAssistantService } from '../../application/services/ai-assistant.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';
import { STAFF_ROLES } from '../../shared/constants/roles.js';
import { uploadPdf } from '../middleware/upload.middleware.js';
import { learningService } from '../../application/services/modules.service.js';

const router = Router();

// Dashboard
router.get(
  '/stats',
  authenticate,
  requireSchool,
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const stats = await dashboardService.getStats(req.user!.schoolId!);
    res.json({ success: true, data: stats });
  })
);

router.get(
  '/charts',
  authenticate,
  requireSchool,
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const charts = await dashboardService.getChartData(req.user!.schoolId!);
    res.json({ success: true, data: charts });
  })
);

router.get(
  '/events',
  authenticate,
  requireSchool,
  authorize(...STAFF_ROLES, UserRole.PARENT, UserRole.STUDENT),
  asyncHandler(async (req, res) => {
    const events = await dashboardService.getEvents(req.user!.schoolId!);
    res.json({ success: true, data: events });
  })
);

router.post(
  '/events',
  authenticate,
  requireSchool,
  authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_OWNER),
  [body('title').notEmpty(), body('startDate').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const event = await dashboardService.createEvent(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: event });
  })
);

router.put(
  '/events/:id',
  authenticate,
  requireSchool,
  authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_OWNER),
  asyncHandler(async (req, res) => {
    const event = await dashboardService.updateEvent(getRouteParam(req.params.id), req.user!.schoolId!, req.body);
    res.json({ success: true, data: event });
  })
);

router.delete(
  '/events/:id',
  authenticate,
  requireSchool,
  authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_OWNER),
  asyncHandler(async (req, res) => {
    const result = await dashboardService.deleteEvent(getRouteParam(req.params.id), req.user!.schoolId!);
    res.json({ success: true, ...result });
  })
);

// Parent Portal
const parentRouter = Router();
parentRouter.use(authenticate, authorize(UserRole.PARENT));

parentRouter.get(
  '/children',
  asyncHandler(async (req, res) => {
    const children = await parentPortalService.getChildren(req.user!.userId);
    res.json({ success: true, data: children });
  })
);

parentRouter.get(
  '/children/:studentId/attendance',
  asyncHandler(async (req, res) => {
    const attendance = await parentPortalService.getChildAttendance(
      getRouteParam(req.params.studentId),
      req.user!.userId
    );
    res.json({ success: true, data: attendance });
  })
);

parentRouter.get(
  '/children/:studentId/results',
  asyncHandler(async (req, res) => {
    const results = await parentPortalService.getChildResults(
      getRouteParam(req.params.studentId),
      req.user!.userId
    );
    res.json({ success: true, data: results });
  })
);

parentRouter.get(
  '/children/:studentId/fees',
  asyncHandler(async (req, res) => {
    const fees = await parentPortalService.getChildFees(getRouteParam(req.params.studentId), req.user!.userId);
    res.json({ success: true, data: fees });
  })
);

parentRouter.get(
  '/children/:studentId/timetable',
  asyncHandler(async (req, res) => {
    const timetable = await parentPortalService.getChildTimetable(
      getRouteParam(req.params.studentId),
      req.user!.userId
    );
    res.json({ success: true, data: timetable });
  })
);

parentRouter.get(
  '/children/:studentId/assignments',
  asyncHandler(async (req, res) => {
    const assignments = await parentPortalService.getChildAssignments(
      getRouteParam(req.params.studentId),
      req.user!.userId
    );
    res.json({ success: true, data: assignments });
  })
);

parentRouter.get(
  '/children/:studentId/library',
  asyncHandler(async (req, res) => {
    const library = await parentPortalService.getChildLibrary(
      getRouteParam(req.params.studentId),
      req.user!.userId
    );
    res.json({ success: true, data: library });
  })
);

parentRouter.get(
  '/children/:studentId/transport',
  asyncHandler(async (req, res) => {
    const transport = await parentPortalService.getChildTransport(
      getRouteParam(req.params.studentId),
      req.user!.userId
    );
    res.json({ success: true, data: transport });
  })
);

// Student Portal
const studentRouter = Router();
studentRouter.use(authenticate, authorize(UserRole.STUDENT));

studentRouter.get('/profile', asyncHandler(async (req, res) => {
  const profile = await studentPortalService.getProfile(req.user!.userId);
  res.json({ success: true, data: profile });
}));

studentRouter.get('/results', asyncHandler(async (req, res) => {
  const results = await studentPortalService.getResults(req.user!.userId);
  res.json({ success: true, data: results });
}));

studentRouter.get('/attendance', asyncHandler(async (req, res) => {
  const attendance = await studentPortalService.getAttendance(req.user!.userId);
  res.json({ success: true, data: attendance });
}));

studentRouter.get('/fees', asyncHandler(async (req, res) => {
  const fees = await studentPortalService.getFees(req.user!.userId);
  res.json({ success: true, data: fees });
}));

studentRouter.get('/timetable', asyncHandler(async (req, res) => {
  const timetable = await studentPortalService.getTimetable(req.user!.userId);
  res.json({ success: true, data: timetable });
}));

studentRouter.get('/assignments', asyncHandler(async (req, res) => {
  const assignments = await studentPortalService.getAssignments(req.user!.userId);
  res.json({ success: true, data: assignments });
}));

studentRouter.post('/assignments/:id/submit', uploadPdf.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'PDF file is required' });
    return;
  }
  const data = await learningService.submitAssignment(getRouteParam(req.params.id), req.user!.userId, req.file);
  res.status(201).json({ success: true, data });
}));

studentRouter.get('/library', asyncHandler(async (req, res) => {
  const library = await studentPortalService.getLibrary(req.user!.userId);
  res.json({ success: true, data: library });
}));

studentRouter.get('/transport', asyncHandler(async (req, res) => {
  const transport = await studentPortalService.getTransport(req.user!.userId);
  res.json({ success: true, data: transport });
}));

studentRouter.get('/hostel', asyncHandler(async (req, res) => {
  const hostel = await studentPortalService.getHostel(req.user!.userId);
  res.json({ success: true, data: hostel });
}));

// AI Features
const aiRouter = Router();
aiRouter.use(authenticate, requireSchool);

aiRouter.get('/status', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: aiAssistantService.status() });
}));

aiRouter.get('/conversations', asyncHandler(async (req, res) => {
  const data = await aiAssistantService.listConversations(req.user!.userId, req.user!.schoolId!);
  res.json({ success: true, data });
}));

aiRouter.post('/conversations', asyncHandler(async (req, res) => {
  const data = await aiAssistantService.createConversation(req.user!.userId, req.user!.schoolId!, req.body?.language);
  res.json({ success: true, data });
}));

aiRouter.get('/conversations/:id', asyncHandler(async (req, res) => {
  const data = await aiAssistantService.getConversation(req.user!.userId, req.user!.schoolId!, getRouteParam(req.params.id));
  res.json({ success: true, data });
}));

aiRouter.delete('/conversations/:id', asyncHandler(async (req, res) => {
  await aiAssistantService.deleteConversation(req.user!.userId, req.user!.schoolId!, getRouteParam(req.params.id));
  res.json({ success: true });
}));

aiRouter.post(
  '/conversations/:id/messages',
  [body('content').isString().isLength({ min: 1, max: 4000 })],
  validate,
  asyncHandler(async (req, res) => {
    const data = await aiAssistantService.sendMessage(
      req.user!.userId,
      req.user!.role,
      req.user!.schoolId!,
      getRouteParam(req.params.id),
      req.body.content,
      req.body.language
    );
    res.json({ success: true, data });
  })
);

aiRouter.post(
  '/report-comment',
  authorize(...STAFF_ROLES),
  [body('studentName').notEmpty(), body('subject').notEmpty(), body('marks').isNumeric(), body('totalMarks').isNumeric()],
  validate,
  asyncHandler(async (req, res) => {
    const comment = aiService.generateReportComment(req.body);
    res.json({ success: true, data: { comment } });
  })
);

aiRouter.post(
  '/lesson-plan',
  authorize(...STAFF_ROLES),
  [body('subject').notEmpty(), body('topic').notEmpty(), body('grade').notEmpty(), body('duration').isNumeric()],
  validate,
  asyncHandler(async (req, res) => {
    const plan = aiService.generateLessonPlan(req.body);
    res.json({ success: true, data: plan });
  })
);

aiRouter.post(
  '/student-risk',
  authorize(...STAFF_ROLES),
  [body('attendanceRate').isNumeric(), body('averageScore').isNumeric(), body('recentTrend').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const analysis = aiService.analyzeStudentRisk(req.body);
    res.json({ success: true, data: analysis });
  })
);

const mainRouter = Router();
mainRouter.use('/dashboard', router);
mainRouter.use('/parent', parentRouter);
mainRouter.use('/student', studentRouter);
mainRouter.use('/ai', aiRouter);

export default mainRouter;

import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import {
  transportService,
  hostelService,
  healthService,
  hrService,
  inventoryService,
  timetableService,
  learningService,
} from '../../application/services/modules.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';
import { STAFF_ROLES } from '../../shared/constants/roles.js';
import { uploadPdf } from '../middleware/upload.middleware.js';

const router = Router();
router.use(authenticate, requireSchool);

// Transport
router.get('/transport/vehicles', authorize(...STAFF_ROLES, UserRole.TRANSPORT_MANAGER), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await transportService.getVehicles(req.user!.schoolId!) });
}));
router.get('/transport/stats', authorize(...STAFF_ROLES, UserRole.TRANSPORT_MANAGER), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await transportService.getStats(req.user!.schoolId!) });
}));
router.get('/transport/assignments', authorize(...STAFF_ROLES, UserRole.TRANSPORT_MANAGER), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await transportService.getAssignments(req.user!.schoolId!) });
}));
router.post('/transport/vehicles', authorize(UserRole.TRANSPORT_MANAGER, UserRole.PRINCIPAL),
  [body('registration').notEmpty(), body('capacity').isNumeric()], validate,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await transportService.createVehicle(req.user!.schoolId!, req.body) });
  })
);
router.post('/transport/routes', authorize(UserRole.TRANSPORT_MANAGER),
  [body('vehicleId').notEmpty(), body('name').notEmpty()], validate,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await transportService.createRoute(req.body.vehicleId, req.body) });
  })
);

// Hostel
router.get('/hostel/rooms', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await hostelService.getRooms(req.user!.schoolId!) });
}));
router.get('/hostel/stats', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await hostelService.getStats(req.user!.schoolId!) });
}));
router.post('/hostel/rooms', authorize(UserRole.PRINCIPAL),
  [body('name').notEmpty(), body('capacity').isNumeric()], validate,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await hostelService.createRoom(req.user!.schoolId!, req.body) });
  })
);
router.post('/hostel/assign', authorize(UserRole.PRINCIPAL),
  [body('studentId').notEmpty(), body('roomId').notEmpty()], validate,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await hostelService.assignStudent(req.body.studentId, req.body.roomId, req.body.bedNumber) });
  })
);

// Health
router.get('/health/visits', authorize(...STAFF_ROLES, UserRole.NURSE), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await healthService.getVisits(req.user!.schoolId!) });
}));
router.post('/health/visits', authorize(UserRole.NURSE),
  [body('studentId').notEmpty()], validate,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await healthService.recordVisit(req.body) });
  })
);
router.get('/health/medicine', authorize(UserRole.NURSE), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await healthService.getMedicineInventory(req.user!.schoolId!) });
}));

// HR
router.get('/hr/employees', authorize(...STAFF_ROLES, UserRole.HR_OFFICER), asyncHandler(async (req, res) => {
  const result = await hrService.getEmployees(req.user!.schoolId!, req.query as Record<string, unknown>);
  res.json({ success: true, ...result });
}));
router.get('/hr/leave', authorize(...STAFF_ROLES, UserRole.HR_OFFICER), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await hrService.getLeaveRequests(req.user!.schoolId!) });
}));
router.get('/hr/stats', authorize(...STAFF_ROLES, UserRole.HR_OFFICER), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await hrService.getStats(req.user!.schoolId!) });
}));

// Inventory
router.get('/inventory/assets', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await inventoryService.getAssets(req.user!.schoolId!) });
}));
router.post('/inventory/assets', authorize(UserRole.PRINCIPAL),
  [body('name').notEmpty(), body('category').notEmpty()], validate,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await inventoryService.createAsset(req.user!.schoolId!, req.body) });
  })
);
router.get('/inventory/suppliers', authorize(...STAFF_ROLES), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await inventoryService.getSuppliers(req.user!.schoolId!) });
}));

// Timetable
router.get('/timetable/class/:classId', authorize(...STAFF_ROLES, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await timetableService.getClassTimetable(getRouteParam(req.params.classId)) });
}));
router.post('/timetable', authorize(UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL),
  [body('classId').notEmpty(), body('dayOfWeek').isNumeric(), body('startTime').notEmpty(), body('endTime').notEmpty()], validate,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await timetableService.createSlot(req.body) });
  })
);

// Online Learning
router.get('/learning/assignments', authorize(...STAFF_ROLES, UserRole.TEACHER, UserRole.STUDENT), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await learningService.getAssignments(req.user!.schoolId!) });
}));
router.get('/learning/assignments/:id', authorize(...STAFF_ROLES, UserRole.TEACHER, UserRole.STUDENT), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await learningService.getAssignmentById(getRouteParam(req.params.id), req.user!.schoolId!) });
}));
router.get('/learning/assignments/:id/submissions', authorize(UserRole.TEACHER, UserRole.CLASS_TEACHER, ...STAFF_ROLES), asyncHandler(async (req, res) => {
  res.json({ success: true, data: await learningService.getSubmissions(getRouteParam(req.params.id), req.user!.schoolId!) });
}));
router.post('/learning/assignments', authorize(UserRole.TEACHER, UserRole.CLASS_TEACHER),
  uploadPdf.single('file'),
  asyncHandler(async (req, res) => {
    const { classId, subjectId, title, dueDate, totalMarks, description } = req.body;
    if (!classId || !subjectId || !title || !dueDate || totalMarks == null) {
      res.status(400).json({ success: false, message: 'classId, subjectId, title, dueDate, and totalMarks are required' });
      return;
    }
    res.status(201).json({
      success: true,
      data: await learningService.createAssignment(
        {
          classId,
          subjectId,
          title,
          description,
          dueDate,
          totalMarks: Number(totalMarks),
          createdBy: req.user!.userId,
        },
        req.file
      ),
    });
  })
);
router.post('/learning/assignments/:id/submit', authorize(UserRole.STUDENT),
  uploadPdf.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }
    res.status(201).json({
      success: true,
      data: await learningService.submitAssignment(getRouteParam(req.params.id), req.user!.userId, req.file),
    });
  })
);
router.patch('/learning/submissions/:id/grade', authorize(UserRole.TEACHER, UserRole.CLASS_TEACHER),
  [body('marks').optional().isNumeric(), body('feedback').optional().isString()], validate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await learningService.gradeSubmission(getRouteParam(req.params.id), req.user!.schoolId!, {
        marks: req.body.marks != null ? Number(req.body.marks) : undefined,
        feedback: req.body.feedback,
      }),
    });
  })
);

export default router;

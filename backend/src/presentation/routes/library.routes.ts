import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { libraryService } from '../../application/services/library.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';
import { STAFF_ROLES } from '../../shared/constants/roles.js';

const router = Router();

router.use(authenticate, requireSchool);

router.get('/stats', authorize(...STAFF_ROLES, UserRole.LIBRARIAN), asyncHandler(async (req, res) => {
  const stats = await libraryService.getStats(req.user!.schoolId!);
  res.json({ success: true, data: stats });
}));

router.get('/books', authorize(...STAFF_ROLES, UserRole.LIBRARIAN, UserRole.STUDENT), asyncHandler(async (req, res) => {
  const result = await libraryService.findBooks(req.user!.schoolId!, req.query as Record<string, unknown>);
  res.json({ success: true, ...result });
}));

router.post(
  '/books',
  authorize(UserRole.LIBRARIAN, UserRole.PRINCIPAL),
  [body('title').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const book = await libraryService.createBook(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: book });
  })
);

router.put(
  '/books/:id',
  authorize(UserRole.LIBRARIAN, UserRole.PRINCIPAL),
  asyncHandler(async (req, res) => {
    const book = await libraryService.updateBook(getRouteParam(req.params.id), req.user!.schoolId!, req.body);
    res.json({ success: true, data: book });
  })
);

router.get('/borrowings', authorize(...STAFF_ROLES, UserRole.LIBRARIAN), asyncHandler(async (req, res) => {
  const activeOnly = req.query.activeOnly !== 'false';
  const borrowings = await libraryService.getBorrowings(req.user!.schoolId!, activeOnly);
  res.json({ success: true, data: borrowings });
}));

router.post(
  '/borrow',
  authorize(UserRole.LIBRARIAN),
  [body('bookId').notEmpty(), body('studentId').notEmpty(), body('dueDate').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const borrowing = await libraryService.borrowBook(
      req.body.bookId,
      req.body.studentId,
      req.body.dueDate,
      req.body.notes
    );
    res.status(201).json({ success: true, data: borrowing });
  })
);

router.post(
  '/return/:id',
  authorize(UserRole.LIBRARIAN),
  asyncHandler(async (req, res) => {
    const result = await libraryService.returnBook(getRouteParam(req.params.id));
    res.json({ success: true, data: result });
  })
);

export default router;

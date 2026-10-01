import { Router } from 'express';
import { body } from 'express-validator';
import { UserRole } from '@prisma/client';
import { financeService } from '../../application/services/finance.service.js';
import { authenticate, authorize, requireSchool } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';

const router = Router();

router.use(authenticate, requireSchool);

router.get(
  '/summary',
  authorize(UserRole.BURSAR, UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.SCHOOL_OWNER),
  asyncHandler(async (req, res) => {
    const summary = await financeService.getFinancialSummary(req.user!.schoolId!);
    res.json({ success: true, data: summary });
  })
);

router.get(
  '/fee-structures',
  authorize(UserRole.BURSAR, UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.REGISTRAR),
  asyncHandler(async (req, res) => {
    const structures = await financeService.getFeeStructures(req.user!.schoolId!);
    res.json({ success: true, data: structures });
  })
);

router.post(
  '/fee-structures',
  authorize(UserRole.BURSAR, UserRole.ACCOUNTANT, UserRole.SCHOOL_OWNER),
  [body('name').trim().notEmpty(), body('amount').isNumeric()],
  validate,
  asyncHandler(async (req, res) => {
    const structure = await financeService.createFeeStructure(req.user!.schoolId!, req.body);
    res.status(201).json({ success: true, data: structure });
  })
);

router.get(
  '/invoices',
  authorize(UserRole.BURSAR, UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.PARENT),
  asyncHandler(async (req, res) => {
    const result = await financeService.getInvoices(req.user!.schoolId!, req.query as Record<string, unknown>);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/invoices',
  authorize(UserRole.BURSAR, UserRole.ACCOUNTANT),
  [body('studentId').notEmpty(), body('amount').isNumeric()],
  validate,
  asyncHandler(async (req, res) => {
    const invoice = await financeService.createInvoice(req.body);
    res.status(201).json({ success: true, data: invoice });
  })
);

router.post(
  '/invoices/:id/payments',
  authorize(UserRole.BURSAR, UserRole.ACCOUNTANT),
  [body('amount').isNumeric(), body('method').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const payment = await financeService.recordPayment(getRouteParam(req.params.id), req.body);
    res.status(201).json({ success: true, data: payment });
  })
);

export default router;

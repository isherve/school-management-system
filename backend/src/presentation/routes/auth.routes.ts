import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { authService } from '../../application/services/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, asyncHandler } from '../middleware/error.middleware.js';
import { config } from '../../config/index.js';
import { isEmailConfigured } from '../../infrastructure/email/email.service.js';

const router = Router();

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many code requests. Please try again in 15 minutes.' },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification attempts. Please try again later.' },
});

router.get(
  '/otp-email-status',
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: {
        configured: isEmailConfigured(),
        requiredInProduction: config.env === 'production',
      },
    });
  })
);

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user, message: 'Registration successful. Please verify your email.' });
  })
);

router.post(
  '/login/prepare',
  otpRequestLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.preparePasswordLogin(req.body.email, req.body.password);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/login',
  otpVerifyLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('code').isLength({ min: 6, max: 6 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password, code, rememberMe } = req.body;
    const result = await authService.login(email, password, code, rememberMe);
    res.json({ success: true, data: result });
  })
);

router.post(
  '/request-login-code',
  otpRequestLimiter,
  [body('email').isEmail().normalizeEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.requestLoginCode(req.body.email);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/verify-login-code',
  otpVerifyLimiter,
  [body('email').isEmail().normalizeEmail(), body('code').isLength({ min: 6, max: 6 })],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.verifyLoginCode(req.body.email, req.body.code);
    res.json({ success: true, data: result });
  })
);

router.post(
  '/verify-email',
  [body('token').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.body.token);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/forgot-password',
  [body('email').isEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/request-account',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().notEmpty(),
    body('position').trim().notEmpty(),
    body('campus').trim().notEmpty(),
    body('college').trim().notEmpty(),
    body('regNo').trim().notEmpty(),
    body('gender').trim().notEmpty(),
    body('dateOfBirth').notEmpty(),
    body('admissionDate').notEmpty(),
    body('employmentGroup').trim().notEmpty(),
    body('degree').trim().notEmpty(),
    body('qualification').trim().notEmpty(),
    body('parentEmail').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
    body('parentRelationship').optional({ values: 'falsy' }).trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.requestAccount(req.body);
    res.status(201).json({ success: true, ...result });
  })
);

router.post(
  '/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, ...result });
  })
);

router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  })
);

export default router;

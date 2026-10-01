import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserRole } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { config } from '../../config/index.js';
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from '../../shared/errors/app.error.js';
import {
  sendEmail,
  verificationEmailTemplate,
  resetPasswordTemplate,
  loginCodeEmailTemplate,
  isEmailConfigured,
} from '../../infrastructure/email/email.service.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly otpExpiryMs = 10 * 60 * 1000;
  private readonly maxOtpAttempts = 5;

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateOtpCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async cleanupExpiredOtps() {
    await prisma.loginOtp.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }

  private async completeLogin(user: User & { school?: { id: string; name: string; code: string } | null }, rememberMe = false) {
    const tokens = this.generateTokens(
      { userId: user.id, email: user.email, role: user.role, schoolId: user.schoolId },
      rememberMe
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), refreshToken: tokens.refreshToken },
    });

    const { password: _, refreshToken: __, twoFactorSecret: ___, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    schoolId?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.STUDENT,
        schoolId: data.schoolId,
        emailVerifyToken,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await sendEmail({
      to: data.email,
      subject: 'Verify Your Email - School Management System',
      html: verificationEmailTemplate(`${data.firstName} ${data.lastName}`, emailVerifyToken),
    });

    return user;
  }

  private userWithSchoolInclude = {
    school: { select: { id: true, name: true, code: true } },
  } as const;

  private async assertPasswordValid(
    email: string,
    password: string
  ): Promise<User & { school?: { id: string; name: string; code: string } | null }> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: this.userWithSchoolInclude,
    });

    if (!user || !user.password) throw new UnauthorizedError('Invalid credentials');
    if (user.status === 'SUSPENDED') throw new UnauthorizedError('Account suspended');
    if (user.status === 'INACTIVE') throw new UnauthorizedError('Account inactive');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedError('Invalid credentials');

    return user;
  }

  private smtpUnavailableError(): ServiceUnavailableError {
    return new ServiceUnavailableError(
      'Email (SMTP) is required to send login codes. Configure SMTP_HOST, SMTP_USER, and SMTP_PASS on the server.',
      'SMTP_NOT_CONFIGURED'
    );
  }

  private async deliverLoginOtp(normalizedEmail: string, firstName: string) {
    if (config.env === 'production' && !isEmailConfigured()) {
      throw this.smtpUnavailableError();
    }

    await this.cleanupExpiredOtps();

    const code = this.generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.otpExpiryMs);

    await prisma.loginOtp.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, codeHash, expiresAt, attempts: 0 },
      update: { codeHash, expiresAt, attempts: 0 },
    });

    let emailSent = false;
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Your EduSMS Login Code',
        html: loginCodeEmailTemplate(firstName, code),
      });
      emailSent = true;
    } catch (err) {
      console.error(`[Email failed] Could not send login code to ${normalizedEmail}:`, err);
      await prisma.loginOtp.delete({ where: { email: normalizedEmail } }).catch(() => undefined);
      if (config.env === 'production') {
        throw new ServiceUnavailableError(
          'Could not deliver the login code by email. Verify SMTP credentials and try again.',
          'EMAIL_DELIVERY_FAILED'
        );
      }
    }

    if (config.env === 'development' && !isEmailConfigured()) {
      console.log(`[Login Code] ${normalizedEmail}: ${code}`);
    }

    const response: { message: string; devCode?: string; emailFailed?: boolean } = {
      message: 'If the email exists, a login code has been sent',
    };
    if (config.env === 'development' && (!isEmailConfigured() || !emailSent)) {
      response.devCode = code;
      if (isEmailConfigured() && !emailSent) {
        response.emailFailed = true;
      }
    }

    return response;
  }

  private async consumeLoginOtp(normalizedEmail: string, code: string) {
    const stored = await prisma.loginOtp.findUnique({ where: { email: normalizedEmail } });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.loginOtp.delete({ where: { email: normalizedEmail } });
      throw new UnauthorizedError('Invalid or expired code');
    }

    if (stored.attempts >= this.maxOtpAttempts) {
      await prisma.loginOtp.delete({ where: { email: normalizedEmail } });
      throw new UnauthorizedError('Too many failed attempts. Request a new code.');
    }

    const isValid = await bcrypt.compare(code, stored.codeHash);
    if (!isValid) {
      await prisma.loginOtp.update({
        where: { email: normalizedEmail },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedError('Invalid or expired code');
    }

    await prisma.loginOtp.delete({ where: { email: normalizedEmail } });
  }

  /** Step 1: validate password and email a verification code */
  async preparePasswordLogin(email: string, password: string) {
    const user = await this.assertPasswordValid(email, password);
    return this.deliverLoginOtp(this.normalizeEmail(email), user.firstName);
  }

  /** Step 2: password + verification code */
  async login(
    email: string,
    password: string,
    code: string,
    rememberMe = false
  ): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.assertPasswordValid(email, password);
    await this.consumeLoginOtp(normalizedEmail, code);
    return this.completeLogin(user, rememberMe);
  }

  async requestLoginCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      const response: { message: string; hint?: 'no_account' } = {
        message: 'If the email exists, a login code has been sent',
      };
      if (config.env === 'development') {
        response.hint = 'no_account';
      }
      return response;
    }
    if (user.status === 'SUSPENDED') throw new UnauthorizedError('Account suspended');
    if (user.status === 'INACTIVE') throw new UnauthorizedError('Account inactive');

    return this.deliverLoginOtp(normalizedEmail, user.firstName);
  }

  async verifyLoginCode(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.consumeLoginOtp(normalizedEmail, code);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: this.userWithSchoolInclude,
    });
    if (!user) throw new UnauthorizedError('Invalid or expired code');

    return this.completeLogin(user, true);
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) throw new ValidationError('Invalid or expired verification token');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        status: 'ACTIVE',
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    await sendEmail({
      to: email,
      subject: 'Reset Your Password - School Management System',
      html: resetPasswordTemplate(user.firstName, token),
    });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) throw new ValidationError('Invalid or expired reset token');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async requestAccount(data: Record<string, string>) {
    const {
      name, email, phone, position, campus, college, regNo,
      gender, dateOfBirth, admissionDate, employmentGroup, degree, qualification,
    } = data;

    if (!name || !email || !phone || !position || !campus || !college || !regNo || !gender || !dateOfBirth || !admissionDate || !employmentGroup || !degree || !qualification) {
      throw new ValidationError('Missing required fields');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const school = await prisma.school.findFirst({ where: { code: 'DEMO', isActive: true } });
    if (!school) throw new NotFoundError('School');

    const pending = await prisma.accountRequest.findFirst({
      where: { email, schoolId: school.id, status: 'PENDING' },
    });
    if (pending) {
      throw new ConflictError('A pending account request already exists for this email');
    }

    await prisma.accountRequest.create({
      data: {
        schoolId: school.id,
        name,
        email,
        phone,
        position,
        campus,
        college,
        regNo,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        admissionDate: new Date(admissionDate),
        employmentGroup,
        degree,
        qualification,
      },
    });

    await sendEmail({
      to: email,
      subject: 'Account request received — EduSMS',
      html: `<p>Dear ${name},</p><p>We received your account request for <strong>${position}</strong> at ${campus} (${college}). Registration no: ${regNo}.</p><p>An administrator will review your request. You will receive another email if approved.</p>`,
    });

    return { message: 'Account request submitted successfully. You will be notified by email once reviewed.' };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      });
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        schoolId: true,
        school: { select: { id: true, name: true, code: true, logo: true } },
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundError('User');
    return user;
  }

  generateTokens(payload: TokenPayload, rememberMe = false): AuthTokens {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: rememberMe ? '30d' : config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();

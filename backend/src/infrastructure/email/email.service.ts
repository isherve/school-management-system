import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: config.email.user
    ? { user: config.email.user, pass: config.email.pass }
    : undefined,
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!config.email.user) {
    console.log(`[Email Mock] To: ${options.to}, Subject: ${options.subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      ...options,
    });
  } catch (err) {
    console.error(`[Email Error] Failed to send to ${options.to}:`, err);
    throw err;
  }
}

export function verificationEmailTemplate(name: string, token: string): string {
  const url = `${config.frontendUrl}/verify-email?token=${token}`;
  return `
    <h2>Welcome to School Management System</h2>
    <p>Hi ${name},</p>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${url}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
  `;
}

export function resetPasswordTemplate(name: string, token: string): string {
  const url = `${config.frontendUrl}/reset-password?token=${token}`;
  return `
    <h2>Reset Your Password</h2>
    <p>Hi ${name},</p>
    <p>Click the link below to reset your password:</p>
    <a href="${url}">Reset Password</a>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `;
}

export function loginCodeEmailTemplate(firstName: string, code: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e40af; margin-bottom: 8px;">EduSMS Login Code</h2>
      <p>Hello ${firstName},</p>
      <p>Use this one-time code to sign in to your account:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">${code}</p>
      <p style="color: #64748b; font-size: 14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color: #64748b; font-size: 14px;">If you did not request this code, you can safely ignore this email.</p>
    </body>
    </html>
  `;
}

export function isEmailConfigured(): boolean {
  return Boolean(config.email.user);
}

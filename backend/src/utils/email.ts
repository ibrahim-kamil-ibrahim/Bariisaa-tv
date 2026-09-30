import nodemailer from 'nodemailer';
import { env } from '../config/environment';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  requireTLS: true,
  connectionTimeout: 20000,
  greetingTimeout: 15000,
  socketTimeout: 25000,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: env.NODE_ENV === 'production' },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.warn('[Email] Failed to send email:', (error as Error).message);
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${env.APP_URL}/api/v1/auth/verify-email?token=${token}`;
  await sendEmail(
    email,
    'Verify Your Email - Naik',
    `<h1>Welcome to Naik!</h1>
     <p>Click the link below to verify your email address:</p>
     <a href="${verifyUrl}">Verify Email</a>
     <p>This link expires in 24 hours.</p>`
  );
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await sendEmail(
    email,
    'Your Verification Code - Bariisaa',
    `<h1>Your verification code</h1>
     <p>Use this code to verify your email:</p>
     <h2 style="font-size:32px;letter-spacing:6px;margin:16px 0;">${code}</h2>
     <p>This code expires in 5 minutes.</p>`
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${env.APP_URL}/api/v1/auth/reset-password?token=${token}`;
  await sendEmail(
    email,
    'Reset Your Password - Naik',
    `<h1>Password Reset Request</h1>
     <p>Click the link below to reset your password:</p>
     <a href="${resetUrl}">Reset Password</a>
     <p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>`
  );
}

export async function sendSubscriptionReminder(email: string, planName: string, daysLeft: number): Promise<void> {
  await sendEmail(
    email,
    `Subscription Expiring Soon - Naik`,
    `<h1>Subscription Reminder</h1>
     <p>Your <strong>${planName}</strong> subscription expires in <strong>${daysLeft} day(s)</strong>.</p>
     <p>Renew now to continue enjoying unlimited access to audiobooks and e-books.</p>`
  );
}

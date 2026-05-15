import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      this.logger.log('Mailer initialized with SMTP');
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  private isEnabled(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.sendEmail(email, 'Reset your password', `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;">Reset Password</a>
      <p style="margin-top:16px;color:#666;font-size:12px;">This link expires in 1 hour.</p>
    `);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?verify=${token}`;
    await this.sendEmail(email, 'Verify your email', `
      <h2>Welcome to Next Tickets!</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;">Verify Email</a>
    `);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.isEnabled()) {
      this.logger.log(`[MAIL DISABLED] Would send to ${to}: ${subject}`);
      return;
    }
    try {
      await this.transporter!.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@nexttickets.com',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
    }
  }
}

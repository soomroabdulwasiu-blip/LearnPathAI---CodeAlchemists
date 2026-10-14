import fs from 'fs';
import path from 'path';
import nodemailer, { type Transporter } from 'nodemailer';

export interface SendOtpOptions {
  to: string;
  otp: string;
  type: 'signup' | 'forgot_password' | 'test';
  name?: string;
}

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  method: 'gmail';
  senderEmail?: string;
  error?: string;
}

function isValidEmail(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !trimmed.toLowerCase().includes('example.com');
}

const CREDENTIALS_FILE = path.resolve(process.cwd(), 'data/gmail_credentials.json');

class EmailService {
  private transporter: Transporter | null = null;
  private currentGmailUser: string = '';
  private currentGmailPass: string = '';
  private lastTestedAt: string | null = null;
  private lastError: string | null = null;

  constructor() {
    this.initCredentials();
  }

  private initCredentials() {
    // 1. Check environment variables first
    const envUser = process.env.GMAIL_USER?.trim() || '';
    const envPass = process.env.GMAIL_APP_PASSWORD?.trim().replace(/\s+/g, '') || '';
    if (envUser && envPass && isValidEmail(envUser)) {
      this.setCredentials(envUser, envPass, false);
      return;
    }

    // 2. Check persistent disk file (saved from UI)
    try {
      if (fs.existsSync(CREDENTIALS_FILE)) {
        const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.gmailUser && data.gmailAppPassword && isValidEmail(data.gmailUser)) {
          this.setCredentials(data.gmailUser, data.gmailAppPassword, false);
        }
      }
    } catch (err: any) {
      console.warn('[EmailService] Could not read persistent credentials:', err?.message);
    }
  }

  public setCredentials(gmailUser: string, gmailAppPassword: string, persist: boolean = true): void {
    const cleanUser = gmailUser.trim().toLowerCase();
    const cleanPass = gmailAppPassword.trim().replace(/\s+/g, '');
    this.currentGmailUser = cleanUser;
    this.currentGmailPass = cleanPass;
    this.lastError = null;

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
      });
      console.log(`[EmailService] Gmail SMTP transport initialized for: ${cleanUser}`);

      if (persist) {
        try {
          const dir = path.dirname(CREDENTIALS_FILE);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(
            CREDENTIALS_FILE,
            JSON.stringify({ gmailUser: cleanUser, gmailAppPassword: cleanPass, updatedAt: new Date().toISOString() }, null, 2),
            'utf-8'
          );
          console.log(`[EmailService] Saved credentials persistently to ${CREDENTIALS_FILE}`);
        } catch (saveErr: any) {
          console.error('[EmailService] Failed to persist credentials to file:', saveErr?.message);
        }
      }
    } catch (err: any) {
      this.lastError = err?.message || 'Failed to initialize transport';
      this.transporter = null;
    }
  }

  public isConfigured(): boolean {
    return Boolean(
      this.transporter &&
      this.currentGmailUser &&
      this.currentGmailPass &&
      isValidEmail(this.currentGmailUser)
    );
  }

  public getStatus() {
    return {
      isConfigured: this.isConfigured(),
      senderEmail: this.currentGmailUser || null,
      method: 'gmail' as const,
      lastTestedAt: this.lastTestedAt,
      lastError: this.lastError,
    };
  }

  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter || !this.currentGmailUser) {
      return {
        success: false,
        message: 'Gmail sender credentials have not been configured yet.',
      };
    }
    try {
      await this.transporter.verify();
      this.lastTestedAt = new Date().toISOString();
      this.lastError = null;
      return {
        success: true,
        message: `Gmail SMTP authenticated successfully for ${this.currentGmailUser}!`,
      };
    } catch (err: any) {
      const msg = err?.message || 'SMTP Authentication Failed';
      this.lastError = msg;
      let friendlyReason = msg;
      if (msg.includes('535') || msg.includes('Username and Password not accepted')) {
        friendlyReason = 'Google rejected the credentials. Make sure 2-Step Verification is ON in your Google Account and you are using a 16-character Google App Password (not your normal password).';
      }
      return {
        success: false,
        message: friendlyReason,
      };
    }
  }

  async sendOtpEmail({ to, otp, type, name }: SendOtpOptions): Promise<SendOtpResult> {
    const normalizedTo = to.trim().toLowerCase();

    if (!this.transporter || !this.isConfigured()) {
      return {
        success: false,
        method: 'gmail',
        error: 'Gmail sender credentials are not configured. Please connect your Gmail address and 16-character Google App Password.',
      };
    }

    const subject =
      type === 'forgot_password'
        ? 'LearnPath AI • Password Reset Verification Code'
        : type === 'test'
        ? 'LearnPath AI • Official Gmail Test Verification Code'
        : 'LearnPath AI • Your Verification Code';

    const title =
      type === 'forgot_password'
        ? 'Reset Your Password'
        : type === 'test'
        ? 'Gmail Connection Verified!'
        : 'Verify Your Account';

    const greeting = name ? `Hello ${name},` : 'Hello,';
    const introText =
      type === 'forgot_password'
        ? 'We received a request to reset the password for your LearnPath AI account. Use the 6-digit verification code below to proceed.'
        : type === 'test'
        ? 'This is a live test email sent directly from your Google Account via official Gmail SMTP. Your OTP delivery pipeline is active!'
        : 'Welcome to LearnPath AI! Use the 6-digit verification code below to verify your email and activate your account.';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B0F19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #121829; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Header Branding -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #1E3A8A 0%, #2D5BFF 50%, #7C3AED 100%); text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">LearnPath AI</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #DBEAFE; font-weight: 500;">Adaptive Python Learning & Knowledge Tracing</p>
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">${title}</h2>
              <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">${greeting}</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">${introText}</p>
              
              <!-- OTP Code Display Box -->
              <div style="background-color: #0F172A; border: 2px dashed #2D5BFF; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #60A5FA; margin-bottom: 8px;">One-Time Verification Code</span>
                <span style="display: inline-block; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #FFFFFF; font-family: 'Courier New', Courier, monospace; text-shadow: 0 0 16px rgba(45, 91, 255, 0.4);">${otp}</span>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748B;">Valid for 10 minutes</p>
              </div>

              <!-- Security Information -->
              <div style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 14px; margin-top: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #FCA5A5;">
                  <strong>Security notice:</strong> For your protection, entering the wrong code 3 times will temporarily freeze password reset attempts for 2 hours. If you did not request this, you can safely ignore this email.
                </p>
              </div>
              <p style="margin: 28px 0 0 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                Need help? Contact LearnPath AI support or respond to your instructor.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0F172A; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">© 2026 LearnPath AI Inc. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"LearnPath AI" <${this.currentGmailUser}>`,
        to: normalizedTo,
        subject,
        html: htmlContent,
        text: `${title}\n\n${introText}\n\nVerification Code: ${otp}\n(Valid for 10 minutes. 3 incorrect attempts will freeze account for 2 hours).`,
      });
      console.log(`[EmailService] Real OTP email sent successfully to ${normalizedTo} via Gmail! Message ID: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        method: 'gmail',
        senderEmail: this.currentGmailUser,
      };
    } catch (err: any) {
      console.error(`[EmailService] Gmail SMTP sending failed to ${normalizedTo}:`, err?.message || err);
      this.lastError = err?.message;
      return {
        success: false,
        method: 'gmail',
        error: `Gmail sending error: ${err?.message || 'Check sender credentials'}.`,
      };
    }
  }
}

export const emailService = new EmailService();

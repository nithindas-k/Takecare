import nodemailer, { Transporter } from "nodemailer";
import { env } from "../configs/env";
import type { IEmailService } from "../services/interfaces/IEmailService";
import type { EmailConfig, SmtpConfig } from "../types/email.type";
import { CONFIG, HttpStatus, MESSAGES } from "../constants/constants";
import { AppError } from "../errors/AppError";
import { ILoggerService } from "./interfaces/ILogger.service";

export class EmailService implements IEmailService {
  private _transporter: Transporter;
  private readonly _fromAddress: string;

  constructor(private _logger: ILoggerService, config?: SmtpConfig) {
    const emailConfig = config || this._getDefaultConfig();

    this._transporter = nodemailer.createTransport(emailConfig);
    this._fromAddress = `"TakeCare" <${env.SMTP_USER}>`;

    this._verifyConnection();
  }

  private _getDefaultConfig(): SmtpConfig {
    const emailUser = env.SMTP_USER;
    const emailPass = env.SMTP_PASS;
    const emailHost = env.SMTP_HOST;
    const emailPort = Number(env.SMTP_PORT) || 587;

    if (!emailUser || !emailPass) {
      throw new AppError(MESSAGES.EMAIL_CREDENTIALS_NOT_CONFIGURED, HttpStatus.INTERNAL_ERROR);
    }

    return {
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
  }

  private async _verifyConnection(): Promise<void> {
    try {
      await this._transporter.verify();
      this._logger.info("Email server is ready");
    } catch (error: unknown) {
      this._logger.error("Email server connection failed", error);
    }
  }

  async sendEmail(config: EmailConfig): Promise<void> {
    await this._transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: config.subject,
      html: config.html,
    });
  }

  async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    try {
      const html = this._getOTPTemplate(otp, name);

      const mailOptions = {
        from: this._fromAddress,
        to: email,
        subject: "Your OTP for Registration - TakeCare",
        html,
      };

      const info = await this._transporter.sendMail(mailOptions);
      this._logger.info("OTP email sent successfully", { messageId: info.messageId });
    } catch (error: unknown) {
      this._logger.error("OTP email sending failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AppError(
        MESSAGES.EMAIL_SEND_FAILED.replace("{error}", errorMessage),
        HttpStatus.INTERNAL_ERROR
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    otp: string
  ): Promise<void> {
    try {
      const html = this._getPasswordResetTemplate(otp, name);

      const mailOptions = {
        from: this._fromAddress,
        to: email,
        subject: "Password Reset OTP - TakeCare",
        html,
      };

      const info = await this._transporter.sendMail(mailOptions);
      this._logger.info("Password reset email sent successfully", { messageId: info.messageId });
    } catch (error: unknown) {
      this._logger.error("Password reset email sending failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AppError(
        MESSAGES.EMAIL_SEND_FAILED.replace("{error}", errorMessage),
        HttpStatus.INTERNAL_ERROR
      );
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const html = this._getWelcomeTemplate(name);

      const mailOptions = {
        from: this._fromAddress,
        to: email,
        subject: "Welcome to TakeCare!",
        html,
      };

      const info = await this._transporter.sendMail(mailOptions);
      this._logger.info("Welcome email sent successfully", { messageId: info.messageId });
    } catch (error: unknown) {
      this._logger.error("Welcome email sending failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AppError(
        MESSAGES.EMAIL_SEND_FAILED.replace("{error}", errorMessage),
        HttpStatus.INTERNAL_ERROR
      );
    }
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationLink: string
  ): Promise<void> {
    try {
      const html = this._getVerificationTemplate(name, verificationLink);

      const mailOptions = {
        from: this._fromAddress,
        to: email,
        subject: "Verify Your Email - TakeCare",
        html,
      };

      const info = await this._transporter.sendMail(mailOptions);
      this._logger.info("Verification email sent successfully", { messageId: info.messageId });
    } catch (error: unknown) {
      this._logger.error("Verification email sending failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AppError(
        MESSAGES.EMAIL_SEND_FAILED.replace("{error}", errorMessage),
        HttpStatus.INTERNAL_ERROR
      );
    }
  }

  async sendContactNotification(data: { name: string, email: string, phone?: string, subject: string, message: string }): Promise<void> {
    try {
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #00A1B0; margin-bottom: 24px;">New Contact Form Submission</h2>
          <div style="margin-bottom: 16px;">
            <strong style="color: #64748b;">From:</strong> ${data.name} (${data.email})
          </div>
          ${data.phone ? `<div style="margin-bottom: 16px;"><strong style="color: #64748b;">Phone:</strong> ${data.phone}</div>` : ''}
          <div style="margin-bottom: 16px;">
            <strong style="color: #64748b;">Subject:</strong> ${data.subject}
          </div>
          <div style="padding: 16px; bg-color: #f8fafc; border-radius: 8px; border-left: 4px solid #00A1B0;">
            <strong style="display: block; margin-bottom: 8px; color: #64748b;">Message:</strong>
            <p style="white-space: pre-wrap; margin: 0; color: #1e293b;">${data.message}</p>
          </div>
          <div style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            Sent from TakeCare Contact Form
          </div>
        </div>
      `;

      await this._transporter.sendMail({
        from: this._fromAddress,
        to: env.SMTP_USER, // Send to the admin (self)
        subject: `[Contact Form] ${data.subject}`,
        html
      });
      this._logger.info("Contact notification email sent");
    } catch (error: unknown) {
      this._logger.error("Failed to send contact notification email", error);
    }
  }

  async sendContactReplyEmail(userEmail: string, userName: string, originalSubject: string, replyMessage: string): Promise<void> {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
          <div style="background-color: #14b8a6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">TakeCare Support</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #14b8a6; margin-top: 0;">Hello ${userName},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for reaching out to us regarding <strong>"${originalSubject}"</strong>.
            </p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #14b8a6; margin: 24px 0;">
              <p style="margin: 0; color: #1e293b; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${replyMessage}</p>
            </div>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              If you have any further questions, please don't hesitate to reply to this email.
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
              Best regards,<br>
              <strong>The TakeCare Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              © 2025 TakeCare Healthcare. All rights reserved.
            </p>
          </div>
        </div>
      `;

      await this._transporter.sendMail({
        from: this._fromAddress,
        to: userEmail,
        subject: `Re: ${originalSubject} - TakeCare Support`,
        html
      });
      this._logger.info("Reply email sent to user", { userEmail });
    } catch (error: unknown) {
      this._logger.error("Failed to send contact reply email", error);
      throw new AppError("Failed to send reply email", HttpStatus.INTERNAL_ERROR);
    }
  }

  private _getOTPTemplate(otp: string, name: string): string {
    const expiryText = `${CONFIG.OTP_EXPIRY_MINUTES} minute${CONFIG.OTP_EXPIRY_MINUTES === 1 ? "" : "s"}`;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #14b8a6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TakeCare</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #14b8a6; margin-top: 0;">Welcome, ${name}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for registering with TakeCare. To complete your registration, please use the following OTP:
          </p>
          
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); margin: 30px 0; padding: 20px; text-align: center; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            ⏱️ This OTP will expire in <strong>${expiryText}</strong>.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
            🔒 For security reasons, please do not share this OTP with anyone.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
            ❓ If you didn't request this OTP, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 TakeCare. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  private _getPasswordResetTemplate(otp: string, name: string): string {
    const expiryText = `${CONFIG.OTP_EXPIRY_MINUTES} minute${CONFIG.OTP_EXPIRY_MINUTES === 1 ? "" : "s"}`;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #14b8a6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TakeCare</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #14b8a6; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Hello <strong>${name}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Please use the following OTP to continue:
          </p>
          
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); margin: 30px 0; padding: 20px; text-align: center; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            ⏱️ This OTP will expire in <strong>${expiryText}</strong>.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
            🔒 For security reasons, please do not share this OTP with anyone.
          </p>
          
          <p style="color: #ef4444; font-size: 14px; margin-top: 10px; font-weight: bold;">
            ⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 TakeCare. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  private _getWelcomeTemplate(name: string): string {
    const dashboardUrl = `${env.CLIENT_URL}/dashboard`;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #14b8a6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TakeCare</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #14b8a6; margin-top: 0;">Welcome to TakeCare, ${name}! 🎉</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We're excited to have you on board! Your account has been successfully created.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Start exploring our healthcare services and connect with qualified doctors.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background-color: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 TakeCare. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  private _getVerificationTemplate(
    name: string,
    verificationLink: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #14b8a6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TakeCare</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #14b8a6; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Hello <strong>${name}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Please click the button below to verify your email address:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="color: #14b8a6; font-size: 12px; word-break: break-all;">
            ${verificationLink}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 TakeCare. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }
}

import nodemailer, { Transporter } from "nodemailer";
import { env } from "../configs/env";
import type { IEmailService } from "../services/interfaces/IEmailService";
import type { EmailConfig, SmtpConfig } from "../types/email.type";
import { CONFIG, HttpStatus, MESSAGES } from "../constants/constants";
import { AppError } from "../errors/AppError";
import { LoggerService } from "./logger.service";

export class EmailService implements IEmailService {
  private transporter: Transporter;
  private readonly fromAddress: string;
  private readonly logger: LoggerService;

  constructor(config?: SmtpConfig) {
    const emailConfig = config || this.getDefaultConfig();

    this.transporter = nodemailer.createTransport(emailConfig);
    this.fromAddress = `"TakeCare" <${env.SMTP_USER}>`;

    this.logger = new LoggerService("EmailService");

    this.verifyConnection();
  }

  private getDefaultConfig(): SmtpConfig {
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

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.info("Email server is ready");
    } catch (error: any) {
      this.logger.error("Email server connection failed", error);
    }
  }

  async sendEmail(config: EmailConfig): Promise<void> {
    await this.transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: config.subject,
      html: config.html,
    });
  }

  async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    try {
      const html = this.getOTPTemplate(otp, name);

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: "Your OTP for Registration - TakeCare",
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.info("OTP email sent successfully", { messageId: info.messageId });
    } catch (error: any) {
      this.logger.error("OTP email sending failed", error);
      throw new AppError(
        MESSAGES.EMAIL_SEND_FAILED.replace("{error}", String(error?.message || error)),
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
      const html = this.getPasswordResetTemplate(otp, name);

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: "Password Reset OTP - TakeCare",
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.info("Password reset email sent successfully", { messageId: info.messageId });
    } catch (error: any) {
      this.logger.error("Password reset email sending failed", error);
      throw new AppError(
        MESSAGES.EMAIL_SEND_FAILED.replace("{error}", String(error?.message || error)),
        HttpStatus.INTERNAL_ERROR
      );
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const html = this.getWelcomeTemplate(name);

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: "Welcome to TakeCare!",
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.info("Welcome email sent successfully", { messageId: info.messageId });
    } catch (error: any) {
      this.logger.error("Welcome email sending failed", error);
      throw new AppError(
        MESSAGES.EMAIL_SEND_FAILED.replace("{error}", String(error?.message || error)),
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
      const html = this.getVerificationTemplate(name, verificationLink);

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: "Verify Your Email - TakeCare",
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.info("Verification email sent successfully", { messageId: info.messageId });
    } catch (error: any) {
      this.logger.error("Verification email sending failed", error);
      throw new AppError(
        MESSAGES.EMAIL_SEND_FAILED.replace("{error}", String(error?.message || error)),
        HttpStatus.INTERNAL_ERROR
      );
    }
  }

  private getOTPTemplate(otp: string, name: string): string {
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

  private getPasswordResetTemplate(otp: string, name: string): string {
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
            ⏱️ This OTP will expire in <strong>1 minute</strong>.
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

  private getWelcomeTemplate(name: string): string {
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

  private getVerificationTemplate(
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

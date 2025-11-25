import nodemailer, { Transporter } from "nodemailer";
import { env } from "../configs/env";
import type { IEmailService, EmailConfig } from "../services/interfaces/IEmailService";

export class EmailService implements IEmailService {
  private transporter: Transporter;
  private readonly fromAddress: string;

  constructor(config?: EmailConfig) {
    const emailConfig = config || this.getDefaultConfig();
    
    this.transporter = nodemailer.createTransport(emailConfig);
    this.fromAddress = `"TackCare" <${env.SMTP_USER}>`;
    
    this.verifyConnection();
  }

  private getDefaultConfig(): EmailConfig {
    const emailUser = env.SMTP_USER;
    const emailPass = env.SMTP_PASS;
    const emailHost = env.SMTP_HOST;
    const emailPort = Number(env.SMTP_PORT) || 587;

    if (!emailUser || !emailPass) {
      throw new Error(
        "Email credentials not configured. Please set SMTP_USER and SMTP_PASS in your .env file"
      );
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
      console.log("✅ Email server is ready");
    } catch (error: any) {
      console.error("❌ Email server connection failed:", error.message);
    }
  }

  async sendOTP(email: string, otp: string, name: string): Promise<void> {
    try {
      const html = this.getOTPTemplate(otp, name);

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: "Your OTP for Registration - TackCare",
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 OTP email sent successfully:", info.messageId);
    } catch (error: any) {
      console.error("❌ OTP email sending failed:", error.message);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  async sendPasswordResetOTP(
    email: string,
    otp: string,
    name: string
  ): Promise<void> {
    try {
      const html = this.getPasswordResetTemplate(otp, name);

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: "Password Reset OTP - TackCare",
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Password reset email sent successfully:", info.messageId);
    } catch (error: any) {
      console.error("❌ Password reset email sending failed:", error.message);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const html = this.getWelcomeTemplate(name);

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: "Welcome to TackCare!",
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Welcome email sent successfully:", info.messageId);
    } catch (error: any) {
      console.error("❌ Welcome email sending failed:", error.message);
      throw new Error(`Failed to send welcome email: ${error.message}`);
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
        subject: "Verify Your Email - TackCare",
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Verification email sent successfully:", info.messageId);
    } catch (error: any) {
      console.error("❌ Verification email sending failed:", error.message);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  private getOTPTemplate(otp: string, name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #14b8a6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TackCare</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #14b8a6; margin-top: 0;">Welcome, ${name}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for registering with TackCare. To complete your registration, please use the following OTP:
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
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
            ❓ If you didn't request this OTP, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 TackCare. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  private getPasswordResetTemplate(otp: string, name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #14b8a6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TackCare</h1>
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
            ⏱️ This OTP will expire in <strong>10 minutes</strong>.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
            🔒 For security reasons, please do not share this OTP with anyone.
          </p>
          
          <p style="color: #ef4444; font-size: 14px; margin-top: 10px; font-weight: bold;">
            ⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 TackCare. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  private getWelcomeTemplate(name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #14b8a6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TackCare</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #14b8a6; margin-top: 0;">Welcome to TackCare, ${name}! 🎉</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We're excited to have you on board! Your account has been successfully created.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Start exploring our healthcare services and connect with qualified doctors.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${"http://localhost:3000"}/dashboard" 
               style="background-color: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 TackCare. All rights reserved.
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
          <h1 style="color: white; margin: 0; font-size: 28px;">TackCare</h1>
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
            © 2025 TackCare. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }
}

import { EmailConfig } from "../../types/email.type";

export interface IEmailService {
  sendEmail(config: EmailConfig): Promise<void>;
  sendOtpEmail(email: string, name: string, otp: string): Promise<void>;
  sendPasswordResetEmail(email: string, name: string, otp: string): Promise<void>;
  sendContactNotification(data: { name: string, email: string, phone?: string, subject: string, message: string }): Promise<void>;
  sendContactReplyEmail(userEmail: string, userName: string, originalSubject: string, replyMessage: string): Promise<void>;
}

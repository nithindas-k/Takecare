export interface IEmailService {
  sendOTP(email: string, otp: string, name: string): Promise<void>;
  sendPasswordResetOTP(email: string, otp: string, name: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
  sendVerificationEmail(email: string, name: string, verificationLink: string): Promise<void>;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

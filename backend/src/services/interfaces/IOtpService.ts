import { OTPUserData, OTPData } from "../../types/otp.type";

export interface IOTPService {
  createAndSendOtp(
    email: string,
    name: string,
    userData: OTPUserData,
    expiryMinutes?: number
  ): Promise<string>;
  verifyOtp(email: string, otp: string): Promise<OTPData>;
  resendOtp(email: string, expiryMinutes?: number, maxSessionAge?: number): Promise<void>;
  createPasswordResetOtp(email: string, name: string, userData: OTPUserData): Promise<void>;
  verifyAndCreateResetToken(email: string, otp: string): Promise<string>;
  verifyResetToken(email: string, resetToken: string): Promise<OTPData>;
  deleteOtp(email: string): Promise<void>;
}

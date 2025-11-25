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


export interface OTPUserData {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: string;
  gender?: "male" | "female" | "other" | null;  
  dob?: Date | null;
}

export interface OTPData {
  email: string;
  otp: string;
  userData: OTPUserData;
  expiresAt: Date;
  createdAt?: Date;
}

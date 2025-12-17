
export interface IOtp {
  email: string;
  otp: string | null;
  userData: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: string;
    gender?: "male" | "female" | "other" | null;
    dob?: Date | null;
  };
  expiresAt: Date;
  createdAt?: Date;
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

/**
 * OTP Data structure
 */
export interface OTPData {
  email: string;
  otp: string;
  userData: OTPUserData;
  expiresAt: Date;
  createdAt?: Date;
}

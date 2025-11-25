// ========================================
// AUTH USER (Simplified for login/session)




// ========================================
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  profileImage?: string;
}

// ========================================
// LOGIN TYPES
// ========================================
export interface LoginRequest {
  email: string;
  password: string;
  role : string
}
export interface LoginResponse {
  user: AuthUser;
  token: string;
}

// ========================================
// REGISTER TYPES
// ========================================
export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender?: "male" | "female" | "other";
  dob?: string;
  role?:"patient" | "doctor" 
}


export interface OtpRequest {
  email: string;
  otp: string;
}


export interface ResendOtpRequest {
  email: string;
}
export interface ResendOtpResponse {
  message: string;
}
export interface ResendOtpDTO {
  email: string;
}

// ========================================
// PASSWORD RESET TYPES
// ========================================
export interface ForgotPasswordRequest {
  email: string;
  
}
export interface ForgotPasswordResponse {
  message: string;
}
export interface ResetPasswordRequest {
  email:string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}
export interface ResetPasswordResponse {
  message: string;
}

// ========================================
// GOOGLE OAUTH TYPES
// ========================================
export interface GoogleAuthResponse {
  user: AuthUser;
  token: string;
}

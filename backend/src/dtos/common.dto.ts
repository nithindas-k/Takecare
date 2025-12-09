export enum Gender {
  Male = "male",
  Female = "female",
  Other = "other",
}

export enum Role {
  Patient = "patient",
  Doctor = "doctor",
  Admin = "admin"

}




export interface LoginDTO {
  email: string;
  password: string;
  role: string
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
  role: string
}

export interface ResendOtpDTO {
  email: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role,
  confirmPassword: string;
  gender: Gender
  dob?: string;
}



export interface BaseUserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string | null;
  phone?: string | null;
}


export interface ForgotPasswordDTO {
  email: string;
  role: string
}

export interface ForgotPasswordVerifyOtpDTO {
  email: string;
  otp: string;
}

export interface ResetPasswordDTO {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}


export interface AuthResponseDTO<T = BaseUserResponseDTO> {
  user: T;
  token: string;
  refreshToken?: string;
}

import { BaseUserResponseDTO, AuthResponseDTO, LoginDTO, RegisterDTO, VerifyOtpDTO, ResendOtpDTO, ForgotPasswordDTO, ForgotPasswordVerifyOtpDTO, ResetPasswordDTO } from "../common.dto";

export { LoginDTO as LoginDoctorDTO, VerifyOtpDTO, ResendOtpDTO, ForgotPasswordDTO, ForgotPasswordVerifyOtpDTO, ResetPasswordDTO };

export type RegisterDoctorDTO = RegisterDTO;
export enum VerificationStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

export interface SubmitVerificationDTO {
  degree: string;
  experience: number;
  speciality: string;
  videoFees: number;
  chatFees: number;
  licenseNumber?: string;
  languages?: string[];
}

export interface DoctorResponseDTO extends BaseUserResponseDTO {
  gender?: string | null;
  dob?: string | null;
  verificationStatus: VerificationStatus
  rejectionReason?: string | null;
  licenseNumber?: string | null;
  qualifications: string[];
  specialty?: string | null;
  experienceYears?: number | null;
  VideoFees?: number | null;
  ChatFees?: number | null;
  languages: string[];
  ratingAvg: number;
  ratingCount: number;
}

export type DoctorAuthResponseDTO = AuthResponseDTO<DoctorResponseDTO>;


export interface UpdateDoctorProfileDTO {
  name?: string;
  phone?: string;
  specialty?: string;
  qualifications?: string[];
  experienceYears?: number;
  VideoFees?: number;
  ChatFees?: number;
  languages?: string[];
  licenseNumber?: string;
  gender?: "male" | "female" | "other";
  dob?: string | Date;
  about?: string;
}

export interface VerificationResponseDTO {
  message: string;
  verificationStatus: VerificationStatus;
  verificationDocuments?: string[];
}


export interface VerificationFormDataDTO {
  degree: string;
  experience: number;
  speciality: string;
  videoFees: number;
  chatFees: number;
  licenseNumber?: string | null;
  languages: string[];
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  verificationDocuments: string[];
  canResubmit: boolean;
}

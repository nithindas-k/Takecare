import { BaseUserResponseDTO, AuthResponseDTO, LoginDTO, RegisterDTO, VerifyOtpDTO, ResendOtpDTO, ForgotPasswordDTO, ForgotPasswordVerifyOtpDTO, ResetPasswordDTO } from "../common.dto";

export { LoginDTO as LoginUserDTO, VerifyOtpDTO, ResendOtpDTO, ForgotPasswordDTO, ForgotPasswordVerifyOtpDTO, ResetPasswordDTO };

export type RegisterUserDTO = RegisterDTO;

export interface UserResponseDTO extends BaseUserResponseDTO {
  gender?: "male" | "female" | "other" | null;
  dob?: Date | string | null;
  customId?: string;
}

export type UserAuthResponseDTO = AuthResponseDTO<UserResponseDTO>;


export interface UpdateUserProfileDTO {
  name?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  dob?: string | Date;
  profileImage?: string;
}

export interface DoctorAdditionalInfoDTO {
  specialty?: string | null;
  qualifications?: string[];
  experienceYears?: number | null;
  VideoFees?: number | null;
  ChatFees?: number | null;
  languages?: string[];
  licenseNumber?: string | null;
  about?: string | null;
}

export interface UnifiedUpdateProfileDTO {
  information: UpdateUserProfileDTO;
  additionalInformation?: DoctorAdditionalInfoDTO;
}

export type UnifiedUserProfileResponseDTO = UserResponseDTO & Partial<DoctorAdditionalInfoDTO> & {
  doctorProfileId?: string;
  verificationStatus?: string;
};

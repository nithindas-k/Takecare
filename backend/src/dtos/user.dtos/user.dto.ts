import { BaseUserResponseDTO, AuthResponseDTO, LoginDTO, RegisterDTO, VerifyOtpDTO, ResendOtpDTO, ForgotPasswordDTO, ForgotPasswordVerifyOtpDTO, ResetPasswordDTO } from "../common.dto";

export { LoginDTO as LoginUserDTO, VerifyOtpDTO, ResendOtpDTO, ForgotPasswordDTO, ForgotPasswordVerifyOtpDTO, ResetPasswordDTO };

export interface RegisterUserDTO extends RegisterDTO {

}

export interface UserResponseDTO extends BaseUserResponseDTO {
}

export type UserAuthResponseDTO = AuthResponseDTO<UserResponseDTO>;

/**
 * Update User Profile DTO
 */
export interface UpdateUserProfileDTO {
  name?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  dob?: string | Date;
  profileImage?: string;
}

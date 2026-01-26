import type {
  RegisterDTO,
  LoginDTO,
  VerifyOtpDTO,
  ResendOtpDTO,
  ForgotPasswordDTO,
  ForgotPasswordVerifyOtpDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  AuthResponseDTO,
  BaseUserResponseDTO,
} from "../../dtos/common.dto";

export interface IAuthService {
  register(data: RegisterDTO): Promise<{ email: string }>;
  verifyOtp(data: VerifyOtpDTO): Promise<AuthResponseDTO<BaseUserResponseDTO>>;
  resendOtp(data: ResendOtpDTO): Promise<void>;
  login(data: LoginDTO): Promise<AuthResponseDTO<BaseUserResponseDTO>>;
  forgotPassword(data: ForgotPasswordDTO): Promise<void>;
  forgotPasswordVerifyOtp(data: ForgotPasswordVerifyOtpDTO): Promise<{ resetToken: string }>;
  resetPassword(data: ResetPasswordDTO): Promise<void>;
  changePassword(data: ChangePasswordDTO): Promise<void>;
  getDoctorStatus(userId: string): Promise<string>;
  getDoctorId(userId: string): Promise<string | undefined>;
  refreshToken(token: string): Promise<{ accessToken: string }>;
}

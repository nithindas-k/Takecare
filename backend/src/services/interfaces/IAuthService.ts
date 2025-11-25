import type {
  RegisterDTO,
  LoginDTO,
  VerifyOtpDTO,
  ResendOtpDTO,
  ForgotPasswordDTO,
  ForgotPasswordVerifyOtpDTO,
  ResetPasswordDTO,
  AuthResponseDTO,
} from "../../dtos/common.dto";

export interface IAuthService {
  register(data: RegisterDTO): Promise<{ email: string }>;
  verifyOtp(data: VerifyOtpDTO): Promise<AuthResponseDTO<any>>;
  resendOtp(data: ResendOtpDTO): Promise<void>;
  login(data: LoginDTO): Promise<AuthResponseDTO<any>>;
  forgotPassword(data: ForgotPasswordDTO): Promise<void>;
  forgotPasswordVerifyOtp(data: ForgotPasswordVerifyOtpDTO): Promise<{ resetToken: string }>;
  resetPassword(data: ResetPasswordDTO): Promise<void>;
}

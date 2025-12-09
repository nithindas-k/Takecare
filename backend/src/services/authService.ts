import { generateAccessToken, verifyRefreshToken } from "../utils/jwt.util";
import {
  hashPassword,
  comparePassword,
  validatePassword,
  validatePasswordMatch,
} from "../utils/password.util";
import { MESSAGES, STATUS } from "../constants/constants";
import type { IAuthService } from "./interfaces/IAuthService";
import type {
  RegisterDTO,
  LoginDTO,
  VerifyOtpDTO,
  ResendOtpDTO,
  ForgotPasswordDTO,
  ForgotPasswordVerifyOtpDTO,
  ResetPasswordDTO,
  AuthResponseDTO,
  BaseUserResponseDTO,
  Gender,
} from "../dtos/common.dto";
import type { IUserDocument } from "../types/user.type";
import { IUserRepository } from "repositories/interfaces/IUser.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IOTPService } from "./interfaces/IOtpService";
import { AuthValidator } from "../validators/auth.validator";
import { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from "../errors/AppError";
import { LoggerService } from "./logger.service";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";

export class AuthService implements IAuthService {
  private readonly logger: LoggerService;

  constructor(
    private _userRepository: IUserRepository,
    private _otpService: IOTPService,
    private _doctorRepository: IDoctorRepository
  ) {
    this.logger = new LoggerService("AuthService");
  }

  async register(data: RegisterDTO): Promise<{ email: string }> {
    this.logger.info("User registration attempt", { email: data.email, role: data.role });


    AuthValidator.validateRegisterInput(data);
    validatePasswordMatch(data.password, data.confirmPassword);
    validatePassword(data.password);

    await this.checkUserDoesNotExist(data.email, data.phone);

    const passwordHash = await hashPassword(data.password);
    const gender = this.normalizeGender(data.gender);

    await this._otpService.createAndSendOtp(
      data.email,
      data.name,
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        gender,
        dob: data.dob ? new Date(data.dob) : null,
      },
      1
    );

    this.logger.info("Registration OTP sent successfully", { email: data.email });

    return { email: data.email };
  }

  async verifyOtp(
    data: VerifyOtpDTO & { role: "patient" | "doctor" | "admin" }
  ): Promise<AuthResponseDTO<BaseUserResponseDTO>> {
    this.logger.info("OTP verification attempt", { email: data.email });

    const otpRecord = await this._otpService.verifyOtp(data.email, data.otp);

    const user = await this._userRepository.create({
      name: otpRecord.userData.name,
      email: otpRecord.userData.email,
      phone: otpRecord.userData.phone,
      passwordHash: otpRecord.userData.passwordHash,
      role: otpRecord.userData.role as "patient" | "doctor" | "admin",
      gender: (otpRecord.userData.gender as Gender) || null,
      dob: otpRecord.userData.dob || null,
      isActive: true,
    });


    if (String(user.role).toLowerCase() === "doctor") {
      const existingDoctor = await this._doctorRepository.findByUserId(user._id.toString());

      if (!existingDoctor) {
        await this._doctorRepository.create({
          userId: user._id,
          licenseNumber: null,
          qualifications: [],
          specialty: null,
          experienceYears: null,
          VideoFees: null,
          ChatFees: null,
          languages: [],
          verificationStatus: VerificationStatus.Pending,
          verificationDocuments: [],
          rejectionReason: null,
          ratingAvg: 0,
          ratingCount: 0,
          isActive: true,
        });

        this.logger.info("Doctor profile created", { userId: user._id.toString() });
      }
    }

    const token = generateAccessToken(user);
    await this._otpService.deleteOtp(data.email);

    this.logger.info("OTP verification successful", { email: data.email, role: user.role });

    return {
      user: this.mapUserResponse(user),
      token,
    };
  }

  async resendOtp(data: ResendOtpDTO): Promise<void> {
    this.logger.info("Resend OTP request", { email: data.email });

    const existingUser = await this._userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictError("This email is already registered. Please login instead.");
    }

    await this._otpService.resendOtp(data.email, 1, 30);
    this.logger.info("OTP resent successfully", { email: data.email });
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO<BaseUserResponseDTO>> {
    this.logger.info("Login attempt", { email: data.email, role: data.role });

    const user = await this.validateLogin(data.email, data.password, data.role);

    const token = generateAccessToken(user);

    this.logger.info("Login successful", { email: data.email, role: user.role });

    return {
      user: this.mapUserResponse(user),
      token,
    };
  }

  async forgotPassword(
    data: ForgotPasswordDTO & { role: "patient" | "doctor" | "admin" }
  ): Promise<void> {
    this.logger.info("Forgot password request", { email: data.email });

    const user = await this._userRepository.findByEmail(data.email);

    if (!user) {
      throw new NotFoundError("No account found with this email");
    }

    if (data.role && user.role !== data.role) {
      throw new NotFoundError("No account found with this email");
    }

    const gender = this.normalizeGender(user.gender ?? undefined);

    await this._otpService.createPasswordResetOtp(data.email, user.name, {
      name: user.name,
      email: user.email,
      phone: (user.phone as string) || "",
      passwordHash: user.passwordHash || "",
      role: user.role,
      gender,
      dob: user.dob || null,
    });

    this.logger.info("Password reset OTP sent", { email: data.email });
  }

  async forgotPasswordVerifyOtp(
    data: ForgotPasswordVerifyOtpDTO
  ): Promise<{ resetToken: string }> {
    this.logger.info("Forgot password OTP verification", { email: data.email });

    const resetToken = await this._otpService.verifyAndCreateResetToken(
      data.email,
      data.otp
    );

    this.logger.info("Reset token created", { email: data.email });

    return { resetToken };
  }

  async resetPassword(data: ResetPasswordDTO): Promise<void> {
    this.logger.info("Password reset attempt", { email: data.email });

    validatePasswordMatch(data.newPassword, data.confirmPassword);
    validatePassword(data.newPassword);

    await this._otpService.verifyResetToken(data.email, data.resetToken);

    const passwordHash = await hashPassword(data.newPassword);
    const user = await this._userRepository.findByEmail(data.email);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await this._userRepository.updateById(user._id, { passwordHash });
    await this._otpService.deleteOtp(data.email);

    this.logger.info("Password reset successful", { email: data.email });
  }

  async getDoctorStatus(userId: string): Promise<string> {
    const doctor = await this._doctorRepository.findByUserId(userId);
    return doctor?.verificationStatus || "pending";
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await this._userRepository.findById(decoded.userId);

      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      if (!user.isActive) {
        throw new ForbiddenError(MESSAGES.USER_BLOCKED);
      }

      const accessToken = generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  private normalizeGender(gender?: string | Gender): Gender | null {
    if (!gender) return null;

    const normalized =
      typeof gender === "string"
        ? gender.toLowerCase().trim()
        : String(gender).toLowerCase().trim();

    if (normalized === "male") return "male" as Gender;
    if (normalized === "female") return "female" as Gender;
    if (normalized === "other") return "other" as Gender;

    return null;
  }

  private async checkUserDoesNotExist(
    email: string,
    phone: string
  ): Promise<void> {
    const existingUser = await this._userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const existingPhone = await this._userRepository.findByPhone(phone);
    if (existingPhone) {
      throw new ConflictError("User with this phone number already exists");
    }
  }

  private async validateLogin(
    email: string,
    password: string,
    role: string
  ): Promise<IUserDocument> {

    const user = await this._userRepository.findByEmailIncludingInactive(email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.role !== role) {
      throw new UnauthorizedError("Invalid email or password");
    }


    if (!user.isActive) {
      throw new ForbiddenError(MESSAGES.USER_BLOCKED);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError("Please use Google Sign-In for this account");
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return user;
  }

  private mapUserResponse(user: IUserDocument): BaseUserResponseDTO {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
    };
  }
}

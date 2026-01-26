import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.util";
import { hashPassword, comparePassword, validatePassword, validatePasswordMatch } from "../utils/password.util";
import { MESSAGES, ROLES, GENDER, CONFIG } from "../constants/constants";
import { IAuthService } from "./interfaces/IAuthService";
import { RegisterDTO, LoginDTO, VerifyOtpDTO, ResendOtpDTO, ForgotPasswordDTO, ForgotPasswordVerifyOtpDTO, ResetPasswordDTO, ChangePasswordDTO, AuthResponseDTO, BaseUserResponseDTO, Gender } from "../dtos/common.dto";
import { IUserDocument } from "../types/user.type";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IOTPService } from "./interfaces/IOtpService";
import { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from "../errors/AppError";
import { ILoggerService } from "./interfaces/ILogger.service";
import { UserMapper } from "../mappers/user.mapper";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";

export class AuthService implements IAuthService {
  constructor(
    private _userRepository: IUserRepository,
    private _otpService: IOTPService,
    private _doctorRepository: IDoctorRepository,
    private _logger: ILoggerService
  ) {
  }

  async register(data: RegisterDTO): Promise<{ email: string }> {
    validatePasswordMatch(data.password, data.confirmPassword);
    validatePassword(data.password);

    await this._checkUserDoesNotExist(data.email, data.phone);

    const passwordHash = await hashPassword(data.password);
    const gender = this._normalizeGender(data.gender);

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
      CONFIG.OTP_EXPIRY_MINUTES
    );

    return { email: data.email };
  }

  async verifyOtp(data: VerifyOtpDTO & { role: "patient" | "doctor" | "admin" }): Promise<AuthResponseDTO<BaseUserResponseDTO>> {
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

    let doctorId: string | undefined;
    if (String(user.role).toLowerCase() === ROLES.DOCTOR) {
      const existingDoctor = await this._ensureDoctorProfile(user);
      doctorId = existingDoctor._id.toString();
    }

    const token = generateAccessToken(user, doctorId);
    const refreshToken = generateRefreshToken(user, doctorId);
    await this._otpService.deleteOtp(data.email);

    return {
      user: UserMapper.toDTO(user),
      token,
      refreshToken,
    };
  }

  async resendOtp(data: ResendOtpDTO): Promise<void> {
    const existingUser = await this._userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError(MESSAGES.EMAIL_ALREADY_REGISTERED);
    }
    await this._otpService.resendOtp(data.email, CONFIG.OTP_EXPIRY_MINUTES, CONFIG.OTP_RESEND_DELAY_SECONDS);
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO<BaseUserResponseDTO>> {
    const user = await this._validateLogin(data.email, data.password, data.role);
    let doctorId: string | undefined;

    if (String(user.role).toLowerCase() === ROLES.DOCTOR) {
      const doctor = await this._doctorRepository.findByUserId(user._id.toString());
      doctorId = doctor?._id.toString();
    }

    const token = generateAccessToken(user, doctorId);
    const refreshToken = generateRefreshToken(user, doctorId);

    return {
      user: UserMapper.toDTO(user),
      token,
      refreshToken,
    };
  }

  async forgotPassword(data: ForgotPasswordDTO & { role: "patient" | "doctor" | "admin" }): Promise<void> {
    const user = await this._userRepository.findByEmail(data.email);

    if (!user) {
      throw new NotFoundError(MESSAGES.NO_ACCOUNT_FOUND);
    }

    if (data.role && user.role !== data.role) {
      throw new NotFoundError(MESSAGES.NO_ACCOUNT_FOUND);
    }

    const gender = this._normalizeGender(user.gender ?? undefined);

    await this._otpService.createPasswordResetOtp(data.email, user.name, {
      name: user.name,
      email: user.email,
      phone: (user.phone as string) || "",
      passwordHash: user.passwordHash || "",
      role: user.role,
      gender,
      dob: user.dob || null,
    });
  }

  async forgotPasswordVerifyOtp(data: ForgotPasswordVerifyOtpDTO): Promise<{ resetToken: string }> {
    const resetToken = await this._otpService.verifyAndCreateResetToken(data.email, data.otp);
    return { resetToken };
  }

  async resetPassword(data: ResetPasswordDTO): Promise<void> {
    validatePasswordMatch(data.newPassword, data.confirmPassword);
    validatePassword(data.newPassword);

    await this._otpService.verifyResetToken(data.email, data.resetToken);
    const passwordHash = await hashPassword(data.newPassword);
    const user = await this._userRepository.findByEmail(data.email);

    if (!user) {
      throw new NotFoundError(MESSAGES.NOT_FOUND);
    }

    await this._userRepository.updateById(user._id, { passwordHash });
    await this._otpService.deleteOtp(data.email);
  }

  async changePassword(data: ChangePasswordDTO): Promise<void> {
    const { userId, oldPassword, newPassword, confirmPassword } = data;

    validatePasswordMatch(newPassword, confirmPassword);
    validatePassword(newPassword);

    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError(MESSAGES.GOOGLE_SIGNIN_REQUIRED);
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Incorrect old password");
    }

    // Check if new password is same as old
    if (oldPassword === newPassword) {
      throw new UnauthorizedError("New password cannot be the same as old password");
    }

    const passwordHash = await hashPassword(newPassword);
    await this._userRepository.updateById(userId, { passwordHash });
  }

  async getDoctorStatus(userId: string): Promise<string> {
    const doctor = await this._doctorRepository.findByUserId(userId);
    return doctor?.verificationStatus || VerificationStatus.Pending;
  }

  async getDoctorId(userId: string): Promise<string | undefined> {
    const doctor = await this._doctorRepository.findByUserId(userId);
    return doctor?._id.toString();
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await this._userRepository.findById(decoded.userId);

      if (!user) {
        throw new UnauthorizedError(MESSAGES.NOT_FOUND);
      }

      if (!user.isActive) {
        throw new ForbiddenError(MESSAGES.USER_BLOCKED);
      }

      let doctorId: string | undefined;
      if (String(user.role).toLowerCase() === ROLES.DOCTOR) {
        const doctor = await this._doctorRepository.findByUserId(user._id.toString());
        doctorId = doctor?._id.toString();
      }

      const accessToken = generateAccessToken(user, doctorId);
      return { accessToken };
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      throw new UnauthorizedError(MESSAGES.INVALID_REFRESH_TOKEN);
    }
  }

  private _normalizeGender(gender?: string | Gender): Gender | null {
    if (!gender) return null;
    const normalized = String(gender).toLowerCase().trim();
    if (normalized === GENDER.MALE) return GENDER.MALE as Gender;
    if (normalized === GENDER.FEMALE) return GENDER.FEMALE as Gender;
    if (normalized === GENDER.OTHER) return GENDER.OTHER as Gender;
    return null;
  }

  private async _checkUserDoesNotExist(email: string, phone: string): Promise<void> {
    const existingUser = await this._userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError(MESSAGES.USER_EXISTS_EMAIL);
    }
    const existingPhone = await this._userRepository.findByPhone(phone);
    if (existingPhone) {
      throw new ConflictError(MESSAGES.USER_EXISTS_PHONE);
    }
  }

  private async _validateLogin(email: string, password: string, role: string): Promise<IUserDocument> {
    const user = await this._userRepository.findByEmailIncludingInactive(email);

    if (!user || user.role !== role) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new ForbiddenError(MESSAGES.USER_BLOCKED);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError(MESSAGES.GOOGLE_SIGNIN_REQUIRED);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    return user;
  }

  private async _ensureDoctorProfile(user: IUserDocument) {
    let existingDoctor = await this._doctorRepository.findByUserId(user._id.toString());
    if (!existingDoctor) {
      existingDoctor = await this._doctorRepository.create({
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
    }
    return existingDoctor;
  }
}

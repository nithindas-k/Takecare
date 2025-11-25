
import { generateAccessToken } from "../utils/jwt.util";
import {
  hashPassword,
  comparePassword,
  validatePassword,
  validatePasswordMatch,
} from "../utils/password.util";
import { validateEmail } from "../utils/validation.util";
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
import { DoctorRepository } from "../repositories/doctor.repository";
import { IUserRepository } from "repositories/interfaces/IUser.repository";
import { IOTPService } from "./interfaces/IOtpService";

export class AuthService implements IAuthService {

  constructor(private _userRepository : IUserRepository, private _otpService: IOTPService) {}

  async register(data: RegisterDTO): Promise<{ email: string }> {
    this.validateRegisterInput(data);
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

    return { email: data.email };
  }

  async verifyOtp(
    data: VerifyOtpDTO & { role: "patient" | "doctor" | "admin" }
  ): Promise<AuthResponseDTO<BaseUserResponseDTO>> {
    const otpRecord = await this._otpService.verifyOtp(data.email, data.otp);

    const user = await this._userRepository.create({
      name: otpRecord.userData.name,
      email: otpRecord.userData.email,
      phone: otpRecord.userData.phone,
      passwordHash: otpRecord.userData.passwordHash,
      role: otpRecord.userData.role as any,
      gender: (otpRecord.userData.gender as Gender) || null,
      dob: otpRecord.userData.dob || null,
      isActive: true,
    });

    if (String(user.role).toLowerCase() === "doctor") {
      const doctorRepo = new DoctorRepository();
      const existingDoctor = await doctorRepo.findByUserId(user._id.toString());
      if (!existingDoctor) {
        await doctorRepo.create({
          userId: user._id,
          licenseNumber: null,
          qualifications: [],
          specialty: null,
          experienceYears: null,
          VideoFees: null,
          ChatFees: null,
          languages: [],
          verificationStatus: "pending",
          verificationDocuments: [],
          rejectionReason: null,
          ratingAvg: 0,
          ratingCount: 0,
          isActive: true,
        });
      }
    }

    const token = generateAccessToken(user);
    console.log(token);
    await this._otpService.deleteOtp(data.email);

    return {
      user: this.mapUserResponse(user),
      token,
    };
  }

  async resendOtp(data: ResendOtpDTO): Promise<void> {
    const existingUser = await this._userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new Error(
        "This email is already registered. Please login instead."
      );
    }

    await this._otpService.resendOtp(data.email, 1, 30);
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO<BaseUserResponseDTO>> {
    const user = await this.validateLogin(data.email, data.password, data.role);

    const token = generateAccessToken(user);

    return {
      user: this.mapUserResponse(user),
      token,
    };
  }

  async forgotPassword(
    data: ForgotPasswordDTO & { role: "patient" | "doctor" | "admin" }
  ): Promise<void> {
    const user = await this._userRepository.findByEmail(data.email);

    if (!user) {
      throw new Error("No account found with this email");
    }

    if (data.role && user.role !== data.role) {
      throw new Error("No account found with this email");
    }

    const gender = this.normalizeGender(user.gender as any);

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

  async forgotPasswordVerifyOtp(
    data: ForgotPasswordVerifyOtpDTO
  ): Promise<{ resetToken: string }> {
    const resetToken = await this._otpService.verifyAndCreateResetToken(
      data.email,
      data.otp
    );
    return { resetToken };
  }

  async resetPassword(data: ResetPasswordDTO): Promise<void> {
    validatePasswordMatch(data.newPassword, data.confirmPassword);
    validatePassword(data.newPassword);

    await this._otpService.verifyResetToken(data.email, data.resetToken);

    const passwordHash = await hashPassword(data.newPassword);
    const user = await this._userRepository.findByEmail(data.email);

    if (!user) {
      throw new Error("User not found");
    }

    await this._userRepository.updateById(user._id, { passwordHash });
    await this._otpService.deleteOtp(data.email);
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

  private validateRegisterInput(data: RegisterDTO): void {
    if (!validateEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    if (data.phone.length < 10) {
      throw new Error("Invalid phone number");
    }

    if (!data.name || data.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    if (data.gender) {
      const validGenders = ["male", "female", "other"];
      if (!validGenders.includes(String(data.gender).toLowerCase())) {
        throw new Error("Gender must be male, female, or other");
      }
    }
  }

  private async checkUserDoesNotExist(
    email: string,
    phone: string
  ): Promise<void> {
    const existingUser = await this._userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const existingPhone = await this._userRepository.findByPhone(phone);
    if (existingPhone) {
      throw new Error("User with this phone number already exists");
    }
  }

  private async validateLogin(
    email: string,
    password: string,
    role: string
  ): Promise<IUserDocument> {
    const user = await this._userRepository.findByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.role !== role) {
      throw new Error("Invalid email or password");
    }

    if (!user.passwordHash) {
      throw new Error("Please use Google Sign-In for this account");
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
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

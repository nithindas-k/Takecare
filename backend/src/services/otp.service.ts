import { OTPRepository } from "../repositories/otp.repository";
import { EmailService } from "./email.service";
import { generateOtp, getOtpExpiry, isOtpExpired } from "../utils/otp.util";
import type { IOTPService } from "./interfaces/IOtpService";
import type { OTPData, OTPUserData } from "../types/otp.type";
import { LoggerService } from "./logger.service";
import { AppError, ValidationError } from "../errors/AppError";
import { HttpStatus, MESSAGES } from "../constants/constants";

export class OTPService implements IOTPService {
  private otpRepository: OTPRepository;
  private emailService: EmailService;
  private readonly logger: LoggerService;

  constructor(otpRepository?: OTPRepository, emailService?: EmailService) {
    this.otpRepository = otpRepository || new OTPRepository();
    this.emailService = emailService || new EmailService();
    this.logger = new LoggerService("OTPService");
  }

  async createAndSendOtp(
    email: string,
    name: string,
    userData: OTPUserData,
    expiryMinutes: number = 1
  ): Promise<string> {
    const otp = generateOtp(6);
    this.logger.debug("OTP generated", { email });
    const expiresAt = getOtpExpiry(expiryMinutes);

    await this.otpRepository.create({
      email,
      otp,
      userData,
      expiresAt,
    });

    await this.emailService.sendOtpEmail(email, name, otp);
    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<OTPData> {
    const otpRecord = await this.otpRepository.findByEmailAndOtp(email, otp);

    if (!otpRecord) {
      throw new ValidationError(MESSAGES.OTP_INVALID_OR_EXPIRED);
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await this.otpRepository.updateOtp(email, { otp: null, expiresAt: new Date() });
      throw new ValidationError(MESSAGES.OTP_INVALID_OR_EXPIRED);
    }

    return otpRecord;
  }

  async resendOtp(email: string, expiryMinutes: number = 1, maxSessionAge: number = 30): Promise<void> {
    const otpRecord = await this.otpRepository.findOneByField("email", email);

    if (!otpRecord) {
      throw new AppError(MESSAGES.OTP_SESSION_EXPIRED_RESEND, HttpStatus.GONE);
    }

    const sessionAge = Date.now() - new Date(otpRecord.createdAt!).getTime();
    const maxSessionAgeMs = maxSessionAge * 60 * 1000;

    if (sessionAge > maxSessionAgeMs) {
      await this.otpRepository.updateOtp(email, { otp: null, expiresAt: new Date() });
      throw new AppError(MESSAGES.OTP_SESSION_EXPIRED, HttpStatus.GONE);
    }

    const newOtp = generateOtp(6);
    const expiresAt = getOtpExpiry(expiryMinutes);

    await this.otpRepository.updateOtp(email, { otp: newOtp, expiresAt });
    await this.emailService.sendOtpEmail(email, otpRecord.userData?.name || "", newOtp);
  }

  async createPasswordResetOtp(email: string, name: string, userData: OTPUserData): Promise<void> {
    const otp = generateOtp(6);
    const expiresAt = getOtpExpiry(10);

    const existingOtp = await this.otpRepository.findOneByField("email", email);

    if (existingOtp) {
      await this.otpRepository.updateOtp(email, { otp, expiresAt });
    } else {
      await this.otpRepository.create({ email, otp, userData, expiresAt });
    }

    await this.emailService.sendPasswordResetEmail(email, name, otp);
  }

  async verifyAndCreateResetToken(email: string, otp: string): Promise<string> {
    await this.verifyOtp(email, otp);

    const resetToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const resetTokenExpiry = getOtpExpiry(15);

    await this.otpRepository.updateOtp(email, { otp: resetToken, expiresAt: resetTokenExpiry });

    return resetToken;
  }

  async verifyResetToken(email: string, resetToken: string): Promise<OTPData> {
    const otpRecord = await this.otpRepository.findByEmailAndOtp(email, resetToken);

    if (!otpRecord) {
      throw new ValidationError(MESSAGES.RESET_TOKEN_INVALID);
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await this.otpRepository.deleteByEmail(email);
      throw new ValidationError(MESSAGES.RESET_TOKEN_INVALID);
    }

    return otpRecord;
  }

  async deleteOtp(email: string): Promise<void> {
    await this.otpRepository.deleteByEmail(email);
  }
}

import { IOTPRepository } from "../repositories/interfaces/IOtp.repository";
import { IEmailService } from "./interfaces/IEmailService";
import { generateOtp, getOtpExpiry, isOtpExpired } from "../utils/otp.util";
import type { IOTPService } from "./interfaces/IOtpService";
import type { OTPData, OTPUserData } from "../types/otp.type";
import { ILoggerService } from "./interfaces/ILogger.service";
import { AppError, ValidationError } from "../errors/AppError";
import { HttpStatus, MESSAGES } from "../constants/constants";

export class OTPService implements IOTPService {
  constructor(
    private _otpRepository: IOTPRepository,
    private _emailService: IEmailService,
    private _logger: ILoggerService
  ) { }

  async createAndSendOtp(
    email: string,
    name: string,
    userData: OTPUserData,
    expiryMinutes: number = 1
  ): Promise<string> {
    const otp = generateOtp(6);
    this._logger.debug("OTP generated", { email });
    const expiresAt = getOtpExpiry(expiryMinutes);

    await this._otpRepository.create({
      email,
      otp,
      userData,
      expiresAt,
    });

    await this._emailService.sendOtpEmail(email, name, otp);
    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<OTPData> {
    const otpRecord = await this._otpRepository.findByEmailAndOtp(email, otp);

    if (!otpRecord) {
      throw new ValidationError(MESSAGES.OTP_INVALID_OR_EXPIRED);
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await this._otpRepository.updateOtp(email, { otp: null, expiresAt: new Date() });
      throw new ValidationError(MESSAGES.OTP_INVALID_OR_EXPIRED);
    }

    return otpRecord;
  }

  async resendOtp(email: string, expiryMinutes: number = 1, maxSessionAge: number = 30): Promise<void> {
    const otpRecord = await this._otpRepository.findOneByField("email", email);

    if (!otpRecord) {
      throw new AppError(MESSAGES.OTP_SESSION_EXPIRED_RESEND, HttpStatus.GONE);
    }

    const sessionAge = Date.now() - new Date(otpRecord.createdAt!).getTime();
    const maxSessionAgeMs = maxSessionAge * 60 * 1000;

    if (sessionAge > maxSessionAgeMs) {
      await this._otpRepository.updateOtp(email, { otp: null, expiresAt: new Date() });
      throw new AppError(MESSAGES.OTP_SESSION_EXPIRED, HttpStatus.GONE);
    }

    const newOtp = generateOtp(6);
    const expiresAt = getOtpExpiry(expiryMinutes);

    await this._otpRepository.updateOtp(email, { otp: newOtp, expiresAt });
    await this._emailService.sendOtpEmail(email, otpRecord.userData?.name || "", newOtp);
  }

  async createPasswordResetOtp(email: string, name: string, userData: OTPUserData): Promise<void> {
    const otp = generateOtp(6);
    const expiresAt = getOtpExpiry(10);

    const existingOtp = await this._otpRepository.findOneByField("email", email);

    if (existingOtp) {
      await this._otpRepository.updateOtp(email, { otp, expiresAt });
    } else {
      await this._otpRepository.create({ email, otp, userData, expiresAt });
    }

    await this._emailService.sendPasswordResetEmail(email, name, otp);
  }

  async verifyAndCreateResetToken(email: string, otp: string): Promise<string> {
    await this.verifyOtp(email, otp);

    const resetToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const resetTokenExpiry = getOtpExpiry(15);

    await this._otpRepository.updateOtp(email, { otp: resetToken, expiresAt: resetTokenExpiry });

    return resetToken;
  }

  async verifyResetToken(email: string, resetToken: string): Promise<OTPData> {
    const otpRecord = await this._otpRepository.findByEmailAndOtp(email, resetToken);

    if (!otpRecord) {
      throw new ValidationError(MESSAGES.RESET_TOKEN_INVALID);
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await this._otpRepository.deleteByEmail(email);
      throw new ValidationError(MESSAGES.RESET_TOKEN_INVALID);
    }

    return otpRecord;
  }

  async deleteOtp(email: string): Promise<void> {
    await this._otpRepository.deleteByEmail(email);
  }
}

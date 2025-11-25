import { OTPRepository } from "../repositories/otp.repository";
import { EmailService } from "./email.service";
import { generateOtp, getOtpExpiry, isOtpExpired } from "../utils/otp.util";
import type { IOTPService, OTPData, OTPUserData } from "./interfaces/IOtpService";

export class OTPService implements IOTPService {
  private otpRepository: OTPRepository;
  private emailService: EmailService;

  constructor(otpRepository?: OTPRepository, emailService?: EmailService) {
    this.otpRepository = otpRepository || new OTPRepository();
    this.emailService = emailService || new EmailService();
  }

  async createAndSendOtp(
    email: string,
    name: string,
    userData: OTPUserData,
    expiryMinutes: number = 1
  ): Promise<string> {
    const otp = generateOtp(6);
    console.log(otp)
    const expiresAt = getOtpExpiry(expiryMinutes);

    await this.otpRepository.create({
      email,
      otp,
      userData,
      expiresAt,
    });

    await this.emailService.sendOTP(email, otp, name);
    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<OTPData> {
    const otpRecord = await this.otpRepository.findByEmailAndOtp(email, otp);

    if (!otpRecord) {
      throw new Error("Invalid or expired OTP");
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await this.otpRepository.updateOtp(email, { otp: null, expiresAt: new Date() });
      throw new Error("Invalid or expired OTP");
    }

    return otpRecord;
  }

  async resendOtp(email: string, expiryMinutes: number = 1, maxSessionAge: number = 30): Promise<void> {
    const otpRecord = await this.otpRepository.findOneByField("email", email);

    if (!otpRecord) {
      throw new Error("Registration session expired. Please register again to receive a new OTP.");
    }

    const sessionAge = Date.now() - new Date(otpRecord.createdAt!).getTime();
    const maxSessionAgeMs = maxSessionAge * 60 * 1000;

    if (sessionAge > maxSessionAgeMs) {
      await this.otpRepository.updateOtp(email, { otp: null, expiresAt: new Date() });
      throw new Error("Registration session expired. Please register again.");
    }

    const newOtp = generateOtp(6);
    const expiresAt = getOtpExpiry(expiryMinutes);

    await this.otpRepository.updateOtp(email, { otp: newOtp, expiresAt });
    await this.emailService.sendOTP(email, newOtp, otpRecord.userData?.name || "");
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

    await this.emailService.sendPasswordResetOTP(email, otp, name);
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
      throw new Error("Invalid or expired reset token");
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await this.otpRepository.deleteByEmail(email);
      throw new Error("Invalid or expired reset token");
    }

    return otpRecord;
  }

  async deleteOtp(email: string): Promise<void> {
    await this.otpRepository.deleteByEmail(email);
  }
}

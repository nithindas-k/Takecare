import type { IDoctorService } from "./interfaces/IDoctorService";
import { SubmitVerificationDTO, VerificationStatus, UpdateDoctorProfileDTO, VerificationResponseDTO } from "../dtos/doctor.dtos/doctor.dto";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import type { DoctorRegistrationData, DoctorProfileResponse } from "../types/doctor.type";
import { DoctorValidator } from "../validators/doctor.validator";
import { NotFoundError, UnauthorizedError } from "../errors/AppError";
import { LoggerService } from "./logger.service";

export class DoctorService implements IDoctorService {
  private readonly logger: LoggerService;

  constructor(
    private _doctorRepository: IDoctorRepository,
    private _userRepository: IUserRepository
  ) {
    this.logger = new LoggerService("DoctorService");
  }

  async submitVerification(
    userId: string,
    data: SubmitVerificationDTO,
    files: Express.Multer.File[]
  ): Promise<VerificationResponseDTO> {
    this.logger.info("Submitting doctor verification", { userId });

    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.role !== "doctor") {
      throw new UnauthorizedError("Only doctors can submit verification");
    }

    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError("Doctor profile not found");
    }

  
    DoctorValidator.validateVerificationData(data, files);

    const documentUrls: string[] = files.map((file) => file.path);

    await this._doctorRepository.updateById(doctor._id, {
      licenseNumber: data.licenseNumber || null,
      qualifications: [data.degree],
      experienceYears: data.experience,
      specialty: data.speciality,
      VideoFees: data.videoFees,
      ChatFees: data.chatFees,
      languages: data.languages || [],
      verificationDocuments: documentUrls,
      verificationStatus: VerificationStatus.Pending,
      rejectionReason: null,
    });

    this.logger.info("Verification submitted successfully", { userId, doctorId: doctor._id.toString() });

    return {
      message: "Verification submitted successfully. Awaiting admin approval.",
      verificationStatus: VerificationStatus.Pending,
      verificationDocuments: documentUrls,
    };
  }

  async getProfile(userId: string): Promise<DoctorProfileResponse> {
    this.logger.debug("Fetching doctor profile", { userId });

    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError("Doctor profile not found");
    }

    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: doctor._id.toString(),
      userId: doctor.userId.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      licenseNumber: doctor.licenseNumber,
      qualifications: doctor.qualifications,
      specialty: doctor.specialty,
      experienceYears: doctor.experienceYears,
      VideoFees: doctor.VideoFees,
      ChatFees: doctor.ChatFees,
      languages: doctor.languages,
      verificationStatus: doctor.verificationStatus,
      verificationDocuments: doctor.verificationDocuments,
      rejectionReason: doctor.rejectionReason,
      ratingAvg: doctor.ratingAvg,
      ratingCount: doctor.ratingCount,
      isActive: doctor.isActive,
      profileImage: user.profileImage,
      gender: user.gender,
      dob: user.dob,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    };
  }

  validateDoctorRegistrationData(data: DoctorRegistrationData): void {
    DoctorValidator.validateRegistrationData(data);
  }

  validateVerificationData(data: SubmitVerificationDTO, files: Express.Multer.File[]): void {
    DoctorValidator.validateVerificationData(data, files);
  }

  validateDoctorProfileUpdate(data: UpdateDoctorProfileDTO): void {
    DoctorValidator.validateProfileUpdate(data);
  }
}

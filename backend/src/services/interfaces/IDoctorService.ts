import type { SubmitVerificationDTO } from "dtos/doctor.dtos/doctor.dto";

export interface IDoctorService {
  submitVerification(
    userId: string,
    data: SubmitVerificationDTO,
    files: Express.Multer.File[]
  ): Promise<VerificationResponseDTO>;

  validateDoctorRegistrationData(data: any): void;
  validateVerificationData(data: SubmitVerificationDTO, files: Express.Multer.File[]): void;
  validateDoctorProfileUpdate(data: UpdateDoctorProfileDTO): void;
}

export interface UpdateDoctorProfileDTO {
  biography?: string;
  experienceYears?: number;
  VideoFees?: number;
  ChatFees?: number;
  languages?: string[];
}

export interface VerificationResponseDTO {
  message: string;
  verificationStatus: "pending" | "approved" | "rejected";
  /**
   * URLs of the uploaded verification documents (e.g., certificates, licenses).
   */
  verificationDocuments?: string[];
}

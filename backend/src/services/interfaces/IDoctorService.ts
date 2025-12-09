import type { SubmitVerificationDTO, VerificationStatus, UpdateDoctorProfileDTO, VerificationResponseDTO } from "dtos/doctor.dtos/doctor.dto";

export interface IDoctorService {
  submitVerification(
    userId: string,
    data: SubmitVerificationDTO,
    files: Express.Multer.File[]
  ): Promise<VerificationResponseDTO>;

  validateDoctorRegistrationData(data: any): void;
  validateVerificationData(data: SubmitVerificationDTO, files: Express.Multer.File[]): void;
  validateDoctorProfileUpdate(data: UpdateDoctorProfileDTO): void;
  getProfile(userId: string): Promise<any>;
}

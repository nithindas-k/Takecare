import type { SubmitVerificationDTO, VerificationStatus, UpdateDoctorProfileDTO, VerificationResponseDTO } from "dtos/doctor.dtos/doctor.dto";
import type { DoctorDashboardStats } from "../../types/appointment.type";

export interface IDoctorService {
  submitVerification(
    userId: string,
    data: SubmitVerificationDTO,
    files: Express.Multer.File[],
    hasExistingDocuments?: boolean,
    existingDocuments?: string[]
  ): Promise<VerificationResponseDTO>;

  getVerificationFormData(userId: string): Promise<any>;


  getProfile(userId: string): Promise<any>;
  updateProfile(
    userId: string,
    data: UpdateDoctorProfileDTO,
    profileImage?: Express.Multer.File
  ): Promise<any>;
  getVerifiedDoctors(
    query?: string,
    specialty?: string,
    page?: number,
    limit?: number,
    sort?: string,
    experience?: number,
    rating?: number
  ): Promise<{ doctors: any[]; total: number; page: number; totalPages: number }>;
  getDoctorById(doctorId: string): Promise<any>;
  getRelatedDoctors(doctorId: string): Promise<any[]>;
  getDashboardStats(userId: string, startDate?: string, endDate?: string): Promise<DoctorDashboardStats>;
}

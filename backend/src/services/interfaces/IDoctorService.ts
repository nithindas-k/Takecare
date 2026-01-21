import type { SubmitVerificationDTO, VerificationStatus, UpdateDoctorProfileDTO, VerificationResponseDTO, VerificationFormDataDTO } from "../../dtos/doctor.dtos/doctor.dto";
import type { DoctorDashboardStats } from "../../types/appointment.type";

export interface DoctorProfileDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  licenseNumber?: string | null;
  qualifications: string[];
  specialty?: string | null;
  experienceYears?: number | null;
  VideoFees?: number | null;
  ChatFees?: number | null;
  languages: string[];
  verificationStatus: VerificationStatus;
  verificationDocuments: string[];
  rejectionReason?: string | null;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  profileImage?: string | null;
  gender?: "male" | "female" | "other" | null;
  dob?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  about?: string;
}

export interface DoctorPublicDTO {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  speciality?: string | null;
  specialty?: string | null;
  experience?: number | null;
  experienceYears?: number | null;
  fees?: number | null;
  videoFees?: number | null;
  VideoFees?: number | null;
  chatFees?: number | null;
  ChatFees?: number | null;
  location: string;
  rating: number;
  ratingAvg: number;
  reviews: number;
  ratingCount: number;
  available: boolean;
  isActive: boolean;
  qualifications: string[];
  languages: string[];
  about?: string;
  gender?: string | null;
  phone?: string | null;
}

export interface DoctorListDTO {
  id: string;
  name: string;
  image?: string | null;
  speciality?: string | null;
  experience?: number;
  gender?: string | null;
  fees?: number;
  location: string;
  rating: number;
  reviews: number;
  available: boolean;
  customId: string;
}

export interface IDoctorService {
  submitVerification(
    userId: string,
    data: SubmitVerificationDTO,
    files: Express.Multer.File[],
    hasExistingDocuments?: boolean,
    existingDocuments?: string[]
  ): Promise<VerificationResponseDTO>;

  getVerificationFormData(userId: string): Promise<VerificationFormDataDTO>;


  getProfile(userId: string): Promise<DoctorProfileDTO>;
  updateProfile(
    userId: string,
    data: UpdateDoctorProfileDTO,
    profileImage?: Express.Multer.File,
    removeProfileImage?: boolean
  ): Promise<DoctorProfileDTO>;
  getVerifiedDoctors(
    query?: string,
    specialty?: string,
    page?: number,
    limit?: number,
    sort?: string,
    experience?: number,
    rating?: number
  ): Promise<{ doctors: DoctorListDTO[]; total: number; page: number; totalPages: number }>;
  getDoctorById(doctorId: string): Promise<DoctorPublicDTO>;
  getRelatedDoctors(doctorId: string): Promise<DoctorListDTO[]>;
  getDashboardStats(userId: string, startDate?: string, endDate?: string): Promise<DoctorDashboardStats>;
  getLandingPageStats(): Promise<{ doctors: number, patients: number, appointments: number }>;
}

import { VerificationStatus } from "../doctor.dtos/doctor.dto";
import { Address } from "../../types/common";

/**
 * Login Admin DTO
 */
export interface LoginAdminDTO {
    email: string;
    password: string;
}

/**
 * Admin Response DTO
 */
export interface AdminResponseDTO {
    id: string;
    name: string;
    email: string;
    role: string;
}

/**
 * Admin Auth Response DTO
 */
export interface AuthResponseDTO {
    user: AdminResponseDTO;
    token: string;
}

/**
 * Doctor Request DTO (for list view)
 */
export interface DoctorRequestDTO {
    id: string;
    name: string;
    email: string;
    department: string;
    profileImage?: string | null;
    createdAt: Date;
    experienceYears?: number;
    status: VerificationStatus;
    rejectionReason?: string | null;
}

/**
 * Doctor Request Detail DTO (for detail view)
 */
export interface DoctorRequestDetailDTO {
    id: string;
    customId?: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    profileImage?: string | null;
    gender?: string | null;
    dob?: string | null;
    qualifications: string[];
    experienceYears?: number;
    specialties?: string[];
    biography?: string;
    address?: Address;
    VideoFees?: number | null;
    ChatFees?: number | null;
    documents: string[];
    status: VerificationStatus;
    rejectionReason?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User Filter DTO
 */
export interface UserFilterDTO {
    search?: string;
    isActive?: boolean | string;
    page?: number;
    limit?: number;
}

/**
 * Doctor Filter DTO
 */
export interface DoctorFilterDTO {
    search?: string;
    specialty?: string;
    verificationStatus?: string;
    isActive?: boolean | string;
    page?: number;
    limit?: number;
}

/**
 * Appointment Filter DTO
 */
export interface AppointmentFilterDTO {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    doctorId?: string;
    patientId?: string;
    page?: number;
    limit?: number;
}

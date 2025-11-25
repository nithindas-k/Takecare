import type {
  LoginAdminDTO,
  AdminResponseDTO,
  AuthResponseDTO as AdminAuthResponseDTO,
} from "../../dtos/admin.dtos/admin.dtos";

export interface IAdminService {
  loginAdmin(data: LoginAdminDTO): Promise<AdminAuthResponseDTO>;
  getDoctorRequests(): Promise<DoctorRequestDTO[]>;
  getDoctorRequestDetail(doctorId: string): Promise<DoctorRequestDetailDTO | null>;
  approveDoctorRequest(doctorId: string): Promise<void>;
  rejectDoctorRequest(doctorId: string, reason: string): Promise<void>;
  getAllUsers(filters?: UserFilterDTO): Promise<any[]>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  getAllDoctors(page?: number, limit?: number): Promise<{ doctors: any[]; total: number; page: number; limit: number; totalPages: number }>;
  banDoctor(doctorId: string): Promise<void>;
  unbanDoctor(doctorId: string): Promise<void>;
  getAllPatients(page?: number, limit?: number): Promise<{ patients: any[]; total: number; page: number; limit: number; totalPages: number }>;
  getPatientById(patientId: string): Promise<any>;
}

export interface DoctorRequestDTO {
  id: string;
  name: string;
  email: string;
  department: string;
  profileImage?: string | null;
  createdAt: Date;
  experienceYears?: number;
  status: string;
}

export interface DoctorRequestDetailDTO {
  id: string;
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
  address?: any;
  fees: number;
  documents: string[];
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilterDTO {
  role?: string;
  isActive?: boolean;
}

import type {
  LoginAdminDTO,
  AdminResponseDTO,
  AuthResponseDTO as AdminAuthResponseDTO,
  DoctorRequestDTO,
  DoctorRequestDetailDTO,
  UserFilterDTO,
  DoctorFilterDTO,
} from "../../dtos/admin.dtos/admin.dto";
import type { Address, PatientListItem, DoctorListItem, UserListItem } from "../../types/common";

export interface IAdminService {
  loginAdmin(data: LoginAdminDTO): Promise<AdminAuthResponseDTO>;
  getDoctorRequests(): Promise<DoctorRequestDTO[]>;
  getDoctorRequestDetail(doctorId: string, baseUrl?: string): Promise<DoctorRequestDetailDTO | null>;
  approveDoctorRequest(doctorId: string): Promise<void>;
  rejectDoctorRequest(doctorId: string, reason: string): Promise<void>;
  getAllUsers(filters?: UserFilterDTO): Promise<UserListItem[]>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  getAllDoctors(filters: DoctorFilterDTO): Promise<{ doctors: DoctorListItem[]; total: number; page: number; limit: number; totalPages: number }>;
  banDoctor(doctorId: string): Promise<void>;
  unbanDoctor(doctorId: string): Promise<void>;
  getAllPatients(filters: UserFilterDTO): Promise<{ patients: PatientListItem[]; total: number; page: number; limit: number; totalPages: number }>;
  getPatientById(patientId: string): Promise<PatientListItem | null>;
}

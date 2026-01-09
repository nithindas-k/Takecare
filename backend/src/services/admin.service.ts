import { generateAccessToken } from "../utils/jwt.util";
import { comparePassword } from "../utils/password.util";
import { calculatePagination, buildPaginatedResponse } from "../utils/pagination.util";
import { toggleEntityStatus } from "../utils/status-toggle.util";
import { AdminMapper } from "../mappers/admin.mapper";
import { DoctorMapper } from "../mappers/doctor.mapper";
import { UserMapper } from "../mappers/user.mapper";
import { IAdminService } from "../services/interfaces/IAdminService";
import { LoginAdminDTO, AuthResponseDTO, DoctorRequestDTO, DoctorRequestDetailDTO, UserFilterDTO, DoctorFilterDTO } from "../dtos/admin.dtos/admin.dto";
import { IAdminRepository } from "../repositories/interfaces/IAdmin.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { PatientListItem, DoctorListItem, UserListItem } from "../types/common";
import { DashboardStats } from "../types/appointment.type";
import { IUserDocument } from "../types/user.type";
import { IDoctorDocument } from "../types/doctor.type";
import { AppError, UnauthorizedError } from "../errors/AppError";
import { LoggerService } from "./logger.service";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";
import { HttpStatus } from "../constants/constants";

export class AdminService implements IAdminService {
  private readonly logger: LoggerService;

  constructor(
    private _adminRepository: IAdminRepository,
    private _doctorRepository: IDoctorRepository,
    private _userRepository: IUserRepository,
    private _appointmentRepository: IAppointmentRepository
  ) {
    this.logger = new LoggerService("AdminService");
  }

  async loginAdmin(data: LoginAdminDTO): Promise<AuthResponseDTO> {
    const user = await this._adminRepository.findByEmail(data.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = generateAccessToken(user);

    return {
      user: AdminMapper.toResponseDTO(user),
      token,
    };
  }

  async getDoctorRequests(): Promise<DoctorRequestDTO[]> {
    const doctors = await this._doctorRepository.getAllDoctorRequests();
    return doctors.map(DoctorMapper.toDoctorRequestDTO).filter((doc): doc is DoctorRequestDTO => doc !== null);
  }

  async getDoctorRequestDetail(doctorId: string, baseUrl?: string): Promise<DoctorRequestDetailDTO | null> {
    const doc = await this._doctorRepository.getDoctorRequestDetailById(doctorId);

    if (!doc || !doc.userId) {
      return null;
    }

    const dto = DoctorMapper.toDoctorRequestDetailDTO(doc);

    if (baseUrl && dto.documents && dto.documents.length > 0) {
      dto.documents = dto.documents.map((p) => (p.startsWith("http") ? p : baseUrl + p));
    }

    return dto;
  }

  async approveDoctorRequest(doctorId: string): Promise<void> {
    await this._doctorRepository.updateById(doctorId, {
      verificationStatus: VerificationStatus.Approved,
      isActive: true,
    });
  }

  async rejectDoctorRequest(doctorId: string, reason: string): Promise<void> {
    await this._doctorRepository.updateById(doctorId, {
      verificationStatus: VerificationStatus.Rejected,
      rejectionReason: reason,
    });
  }

  async getAllUsers(filters?: UserFilterDTO): Promise<UserListItem[]> {
    return [];
  }

  async getAllPatients(
    filters: UserFilterDTO
  ): Promise<{
    patients: PatientListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { skip } = calculatePagination(page, limit);

    const repoFilter = {
      search: filters.search,
      isActive: typeof filters.isActive === 'string' ? filters.isActive === 'true' : (filters.isActive as boolean | undefined)
    };

    const { patients, total } = await this._userRepository.getAllPatients(skip, limit, repoFilter);

    const mappedPatients = patients.map(UserMapper.toPatientListItem);
    const paginatedResult = buildPaginatedResponse(mappedPatients, total, page, limit);

    return {
      patients: paginatedResult.items,
      total: paginatedResult.total,
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      totalPages: paginatedResult.totalPages,
    };
  }

  async getPatientById(patientId: string): Promise<PatientListItem | null> {
    const patient = await this._userRepository.findById(patientId);

    if (!patient || patient.role !== "patient") {
      return null;
    }

    return UserMapper.toPatientListItem(patient);
  }

  async blockUser(userId: string): Promise<void> {
    await toggleEntityStatus(this._userRepository, userId, false, "User", this.logger);
  }

  async unblockUser(userId: string): Promise<void> {
    await toggleEntityStatus(this._userRepository, userId, true, "User", this.logger);
  }

  async getAllDoctors(
    filters: DoctorFilterDTO
  ): Promise<{
    doctors: DoctorListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { skip } = calculatePagination(page, limit);

    const repoFilter = {
      specialty: filters.specialty,
      search: filters.search,
      verificationStatus: filters.verificationStatus,
      isActive: typeof filters.isActive === 'string' ? filters.isActive === 'true' : (filters.isActive as boolean | undefined)
    };

    const { doctors, total } = await this._doctorRepository.getAllDoctors(skip, limit, repoFilter);

    const mappedDoctors = doctors
      .map((doc: IDoctorDocument): DoctorListItem | null => {
        const user = doc.userId as unknown as IUserDocument;
        if (!user) {
          return null;
        }
        return DoctorMapper.toDoctorListItem(doc, user);
      })
      .filter((doc): doc is DoctorListItem => doc !== null);

    const paginatedResult = buildPaginatedResponse(mappedDoctors, total, page, limit);

    return {
      doctors: paginatedResult.items,
      total: paginatedResult.total,
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      totalPages: paginatedResult.totalPages,
    };
  }

  async banDoctor(doctorId: string): Promise<void> {
    await toggleEntityStatus(this._doctorRepository, doctorId, false, "Doctor", this.logger);
  }

  async unbanDoctor(doctorId: string): Promise<void> {
    await toggleEntityStatus(this._doctorRepository, doctorId, true, "Doctor", this.logger);
  }

  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this._appointmentRepository.getAdminDashboardStats(start, end);
  }
}

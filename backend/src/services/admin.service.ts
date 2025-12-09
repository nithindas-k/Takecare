import { generateAccessToken } from "../utils/jwt.util";
import { comparePassword } from "../utils/password.util";
import { calculatePagination, buildPaginatedResponse } from "../utils/pagination.util";
import { toggleEntityStatus } from "../utils/status-toggle.util";
import mapAdminToResponse from "../mappers/admin.mapper/admin.mapper";
import { mapToDoctorRequestDTO, mapToDoctorRequestDetailDTO, mapToDoctorListItem } from "../mappers/doctor.mapper/doctor.mapper";
import { mapToPatientListItem } from "../mappers/patient.mapper/patient.mapper";
import type {
  IAdminService,
} from "../services/interfaces/IAdminService";

import type {
  LoginAdminDTO,
  AuthResponseDTO,
  DoctorRequestDTO,
  DoctorRequestDetailDTO,
  UserFilterDTO,
} from "../dtos/admin.dtos/admin.dto";
import { IAdminRepository } from "../repositories/interfaces/IDdmin.repository";
import {
  IDoctorRepository,
} from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import type {
  PatientListItem,
  DoctorListItem,
  UserListItem,
} from "../types/common";
import type { IUserDocument } from "../types/user.type";
import type { IDoctorDocument } from "../types/doctor.type";
import { UnauthorizedError, NotFoundError } from "../errors/AppError";
import { LoggerService } from "./logger.service";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";

export class AdminService implements IAdminService {
  private readonly logger: LoggerService;

  constructor(
    private _adminRepository: IAdminRepository,
    private _doctorRepository: IDoctorRepository,
    private _userRepository: IUserRepository
  ) {
    this.logger = new LoggerService("AdminService");
  }

  async loginAdmin(data: LoginAdminDTO): Promise<AuthResponseDTO> {
    this.logger.info("Admin login attempt", { email: data.email });

    const user = await this._adminRepository.findByEmail(data.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = generateAccessToken(user);

    this.logger.info("Admin login successful", { email: data.email });

    return {
      user: mapAdminToResponse(user),
      token,
    };
  }

  async getDoctorRequests(): Promise<DoctorRequestDTO[]> {
    this.logger.debug("Fetching all doctor requests");

    const doctors = await this._doctorRepository.getAllDoctorRequests();

    this.logger.debug("Raw doctors from repository", { count: doctors.length });

    return doctors
      .map(mapToDoctorRequestDTO)
      .filter((doc): doc is DoctorRequestDTO => doc !== null);
  }

  async getDoctorRequestDetail(
    doctorId: string
  ): Promise<DoctorRequestDetailDTO | null> {
    this.logger.debug("Fetching doctor request detail", { doctorId });

    const doc = await this._doctorRepository.getDoctorRequestDetailById(
      doctorId
    );

    if (!doc || !doc.userId) {
      this.logger.warn("Doctor request not found", { doctorId });
      return null;
    }

    return mapToDoctorRequestDetailDTO(doc);
  }

  async approveDoctorRequest(doctorId: string): Promise<void> {
    this.logger.info("Approving doctor request", { doctorId });

    await this._doctorRepository.updateById(doctorId, {
      verificationStatus: VerificationStatus.Approved,
      isActive: true,
    });

    this.logger.info("Doctor request approved successfully", { doctorId });
  }

  async rejectDoctorRequest(doctorId: string, reason: string): Promise<void> {
    this.logger.info("Rejecting doctor request", { doctorId, reason });

    const result = await this._doctorRepository.updateById(doctorId, {
      verificationStatus: VerificationStatus.Rejected,
      rejectionReason: reason,
    });

    this.logger.info("Doctor request rejected successfully", { doctorId, result });
  }

  async getAllUsers(filters?: UserFilterDTO): Promise<UserListItem[]> {
    this.logger.debug("Fetching all users", { filters });
    return [];
  }

  async getAllPatients(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    patients: PatientListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.debug("Fetching all patients", { page, limit });

    const { skip } = calculatePagination(page, limit);
    const { patients, total } = await this._userRepository.getAllPatients(
      skip,
      limit
    );

    const mappedPatients = patients.map(mapToPatientListItem);
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
    this.logger.debug("Fetching patient by ID", { patientId });

    const patient = await this._userRepository.findById(patientId);

    if (!patient || patient.role !== "patient") {
      this.logger.warn("Patient not found", { patientId });
      return null;
    }

    return mapToPatientListItem(patient);
  }

  async blockUser(userId: string): Promise<void> {
    await toggleEntityStatus(this._userRepository, userId, false, "User", this.logger);
  }

  async unblockUser(userId: string): Promise<void> {
    await toggleEntityStatus(this._userRepository, userId, true, "User", this.logger);
  }

  async getAllDoctors(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    doctors: DoctorListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.debug("Fetching all doctors", { page, limit });

    const { skip } = calculatePagination(page, limit);
    const { doctors, total } = await this._doctorRepository.getAllDoctors(
      skip,
      limit
    );

    const mappedDoctors = doctors
      .map((doc: IDoctorDocument): DoctorListItem | null => {
        const userId = doc.userId as unknown as IUserDocument;
        if (!userId) {
          this.logger.warn("Doctor has no associated user", { doctorId: doc._id.toString() });
          return null;
        }
        return mapToDoctorListItem(doc, userId);
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
}

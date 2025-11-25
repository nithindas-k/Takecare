
import { generateAccessToken } from "../utils/jwt.util";
import { comparePassword } from "../utils/password.util";
import mapAdminToResponse from "../mappers/admin.mapper/admin.mapper";
import type {
  IAdminService,
  DoctorRequestDTO,
  DoctorRequestDetailDTO,
  UserFilterDTO,
} from "../services/interfaces/IAdminService";
import type {
  LoginAdminDTO,
  AuthResponseDTO,
} from "../dtos/admin.dtos/admin.dtos";
import { IAdminRepository } from "../repositories/interfaces/IDdmin.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";

export class AdminService implements IAdminService {


  constructor(private _adminRepository: IAdminRepository, private _doctorRepository: IDoctorRepository, private _userRepository: IUserRepository) {

  }

  async loginAdmin(data: LoginAdminDTO): Promise<AuthResponseDTO> {
    const user = await this._adminRepository.findByEmail(data.email);

    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const token = generateAccessToken(user);

    return {
      user: mapAdminToResponse(user),
      token,
    };
  }

  async getDoctorRequests(): Promise<DoctorRequestDTO[]> {
    const doctors = await this._doctorRepository.getPendingDoctorRequests();
    console.log("Raw doctors from repo:", JSON.stringify(doctors, null, 2));

    return doctors.map((doc: any) => {
      if (!doc.userId) {
        console.warn(`Doctor request ${doc._id} has no associated user!`);
        return null;
      }
      return {
        id: doc._id.toString(),
        name: doc.userId.name,
        email: doc.userId.email,
        department: doc.specialty || "",
        profileImage: doc.userId.profileImage || null,
        createdAt: doc.createdAt,
        experienceYears: doc.experienceYears,
        status: doc.verificationStatus,
      };
    }).filter(doc => doc !== null);
  }

  async getDoctorRequestDetail(doctorId: string): Promise<DoctorRequestDetailDTO | null> {
    const doc: any = await this._doctorRepository.getDoctorRequestDetailById(doctorId);

    if (!doc || !doc.userId) {
      return null;
    }

    return {
      id: doc._id.toString(),
      name: doc.userId.name,
      email: doc.userId.email,
      phone: doc.userId.phone,
      department: doc.specialty || "",
      profileImage: doc.userId.profileImage || null,
      gender: doc.userId.gender || null,
      dob: doc.userId.dob || null,
      qualifications: doc.qualifications || [],
      experienceYears: doc.experienceYears,
      specialties: doc.specialties || [],
      biography: doc.biography,
      address: doc.address,
      fees: doc.VideoFees || doc.ChatFees || 200,
      documents: doc.verificationDocuments || [],
      status: doc.verificationStatus,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async approveDoctorRequest(doctorId: string): Promise<void> {
    await this._doctorRepository.updateById(doctorId, {
      verificationStatus: "approved",
      isActive: true,
    });
  }

  async rejectDoctorRequest(doctorId: string, reason: string): Promise<void> {
    await this._doctorRepository.updateById(doctorId, {
      verificationStatus: "rejected",
      rejectionReason: reason,
    });
  }

  async getAllUsers(filters?: UserFilterDTO): Promise<any[]> {
    return [];
  }

  async getAllPatients(page: number = 1, limit: number = 10): Promise<{ patients: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const { patients, total } = await this._userRepository.getAllPatients(skip, limit);

    const mappedPatients = patients.map((patient: any) => ({
      id: patient._id.toString(),
      name: patient.name,
      email: patient.email,
      phone: patient.phone || "N/A",
      profileImage: patient.profileImage || null,
      gender: patient.gender || "N/A",
      dob: patient.dob || null,
      createdAt: patient.createdAt,
      isActive: patient.isActive,
    }));

    return {
      patients: mappedPatients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPatientById(patientId: string): Promise<any | null> {
    const patient: any = await this._userRepository.findById(patientId);

    if (!patient || patient.role !== 'patient') {
      return null;
    }

    return {
      id: patient._id.toString(),
      name: patient.name,
      email: patient.email,
      phone: patient.phone || "N/A",
      profileImage: patient.profileImage || null,
      gender: patient.gender || "N/A",
      dob: patient.dob || null,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      isActive: patient.isActive,
    };
  }

  async blockUser(userId: string): Promise<void> {
    await this._userRepository.updateById(userId, { isActive: false });
  }

  async unblockUser(userId: string): Promise<void> {
    await this._userRepository.updateById(userId, { isActive: true });
  }

  async getAllDoctors(page: number = 1, limit: number = 10): Promise<{ doctors: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const { doctors, total } = await this._doctorRepository.getAllDoctors(skip, limit);

    const mappedDoctors = doctors.map((doc: any) => {
      if (!doc.userId) return null;
      return {
        id: doc._id.toString(),
        name: doc.userId.name,
        email: doc.userId.email,
        department: doc.specialty || "General",
        profileImage: doc.userId.profileImage || null,
        createdAt: doc.createdAt,
        experienceYears: doc.experienceYears || 0,
        status: doc.verificationStatus,
        isActive: doc.isActive,
      };
    }).filter(doc => doc !== null);

    return {
      doctors: mappedDoctors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async banDoctor(doctorId: string): Promise<void> {
    await this._doctorRepository.updateById(doctorId, { isActive: false });
  }

  async unbanDoctor(doctorId: string): Promise<void> {
    await this._doctorRepository.updateById(doctorId, { isActive: true });
  }
}

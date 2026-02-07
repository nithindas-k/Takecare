import { IDoctorService, DoctorListDTO, DoctorPublicDTO, DoctorProfileDTO } from "./interfaces/IDoctorService";
import { UpdateQuery } from "mongoose";
import { SubmitVerificationDTO, VerificationStatus, UpdateDoctorProfileDTO, VerificationResponseDTO, VerificationFormDataDTO } from "../dtos/doctor.dtos/doctor.dto";
import { MESSAGES, PAGINATION, ROLES, STATUS } from "../constants/constants";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { DoctorDashboardStats } from "../types/appointment.type";
import { IUserDocument } from "../types/user.type";
import { IDoctorDocument } from "../types/doctor.type";
import { DoctorValidator } from "../validators/doctor.validator";
import { AppError, NotFoundError, UnauthorizedError } from "../errors/AppError";

import { DoctorMapper } from "../mappers/doctor.mapper";

import { ILoggerService } from "./interfaces/ILogger.service";

export class DoctorService implements IDoctorService {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private _userRepository: IUserRepository,
    private _appointmentRepository: IAppointmentRepository,
    private _logger: ILoggerService
  ) {
  }

  async submitVerification(
    userId: string,
    data: SubmitVerificationDTO,
    files: Express.Multer.File[],
    hasExistingDocuments: boolean = false,
    existingDocuments: string[] = []
  ): Promise<VerificationResponseDTO> {
    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    if (user.role !== ROLES.DOCTOR) {
      throw new UnauthorizedError(MESSAGES.DOCTOR_ONLY_VERIFICATION);
    }

    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError(MESSAGES.DOCTOR_PROFILE_NOT_FOUND);
    }

    const hasDocuments = files.length > 0 || hasExistingDocuments;
    DoctorValidator.validateVerificationData(data, files, hasDocuments);

    let documentUrls: string[];

    if (files.length > 0) {

      const newFileUrls = files.map((file) => file.path);
      const existingUrls = hasExistingDocuments ? existingDocuments : [];
      documentUrls = [...existingUrls, ...newFileUrls];
    } else if (hasExistingDocuments) {

      documentUrls = existingDocuments.length > 0
        ? existingDocuments
        : (doctor.verificationDocuments || []);
    } else {
      throw new AppError(MESSAGES.DOCTOR_MISSING_DOCUMENTS, STATUS.BAD_REQUEST);
    }

    const updateData = {
      licenseNumber: data.licenseNumber || null,
      qualifications: [data.degree],
      experienceYears: data.experience,
      specialty: data.speciality,
      VideoFees: data.videoFees,
      ChatFees: data.chatFees,
      languages: data.languages || [],
      verificationDocuments: documentUrls,
      verificationStatus: VerificationStatus.Pending,
      rejectionReason: null,
    };

    await this._doctorRepository.updateById(doctor._id, updateData);

    return {
      message: MESSAGES.DOCTOR_VERIFICATION_SUBMITTED,
      verificationStatus: VerificationStatus.Pending,
      verificationDocuments: documentUrls,
    };
  }

  async getVerificationFormData(userId: string): Promise<VerificationFormDataDTO> {
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError(MESSAGES.DOCTOR_PROFILE_NOT_FOUND);
    }

    return DoctorMapper.toVerificationFormData(doctor);
  }

  async getProfile(userId: string): Promise<DoctorProfileDTO> {
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError(MESSAGES.DOCTOR_PROFILE_NOT_FOUND);
    }

    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    return DoctorMapper.toProfileDTO(doctor, user);
  }

  async updateProfile(
    userId: string,
    data: UpdateDoctorProfileDTO,
    profileImage?: Express.Multer.File,
    removeProfileImage?: boolean
  ): Promise<DoctorProfileDTO> {
    DoctorValidator.validateProfileUpdate(data);

    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError(MESSAGES.DOCTOR_PROFILE_NOT_FOUND);
    }

    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    const userUpdates: UpdateQuery<IUserDocument> = {};
    if (data.name) userUpdates.name = data.name;
    if (data.phone) userUpdates.phone = data.phone;
    if (data.gender) userUpdates.gender = data.gender;
    if (data.dob) userUpdates.dob = data.dob;

    if (profileImage) {
      userUpdates.profileImage = profileImage.path;
    } else if (removeProfileImage) {
      userUpdates.profileImage = null;
    }

    if (Object.keys(userUpdates).length > 0) {
      await this._userRepository.updateById(userId, userUpdates);
    }

    const doctorUpdates: UpdateQuery<IDoctorDocument> = {};
    if (data.specialty) doctorUpdates.specialty = data.specialty;
    if (data.qualifications) doctorUpdates.qualifications = data.qualifications;
    if (data.experienceYears !== undefined) doctorUpdates.experienceYears = data.experienceYears;
    if (data.VideoFees !== undefined) doctorUpdates.VideoFees = data.VideoFees;
    if (data.ChatFees !== undefined) doctorUpdates.ChatFees = data.ChatFees;
    if (data.languages) doctorUpdates.languages = data.languages;
    if (data.licenseNumber) doctorUpdates.licenseNumber = data.licenseNumber;
    if (data.about) doctorUpdates.about = data.about;

    if (Object.keys(doctorUpdates).length > 0) {
      await this._doctorRepository.updateById(doctor._id, doctorUpdates);
    }

    return this.getProfile(userId);
  }

  async getDoctorById(doctorId: string): Promise<DoctorPublicDTO> {
    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
    }

    if (doctor.verificationStatus !== VerificationStatus.Approved) {
      throw new NotFoundError(MESSAGES.DOCTOR_PROFILE_NOT_AVAILABLE);
    }

    const user = await this._userRepository.findById(doctor.userId.toString());
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    return DoctorMapper.toPublicDTO(doctor, user);
  }


  async getVerifiedDoctors(
    query?: string,
    specialty?: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    sort?: string,
    experience?: number,
    rating?: number
  ): Promise<{ doctors: DoctorListDTO[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") sortOptions = { VideoFees: 1 };
    else if (sort === "price_desc") sortOptions = { VideoFees: -1 };

    const result = await this._doctorRepository.getAllDoctors(skip, limit, {
      specialty,
      search: query,
      sort: sortOptions,
      verificationStatus: VerificationStatus.Approved,
      isActive: true,
      minExperience: experience,
      minRating: rating
    });

    const mappedDoctors = result.doctors.map(doc =>
      DoctorMapper.toListDTO(doc, doc.userId as unknown as IUserDocument)
    );

    return {
      doctors: mappedDoctors,
      total: result.total,
      page: page,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async getRelatedDoctors(doctorId: string): Promise<DoctorListDTO[]> {
    const currentDoctor = await this._doctorRepository.findById(doctorId);
    if (!currentDoctor) {
      throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
    }

    if (!currentDoctor.specialty) {
      return [];
    }


    const relatedDocs = await this._doctorRepository.findRelatedDoctors(currentDoctor.specialty, doctorId, 4);

    return relatedDocs.map(doc => {
      const user = doc.userId as unknown as IUserDocument;
      return DoctorMapper.toListDTO(doc, user);
    });
  }

  async getDashboardStats(userId: string, startDate?: string, endDate?: string): Promise<DoctorDashboardStats> {
    const doctor = await this._doctorRepository.findByUserId(userId);
    // console.log("DoctorService.getDashboardStats doctor:", doctor?._id);
    if (!doctor) {
      throw new NotFoundError(MESSAGES.DOCTOR_PROFILE_NOT_FOUND);
    }
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const result = await this._appointmentRepository.getDoctorDashboardStats(doctor._id.toString(), start, end);
    // console.log("DoctorService.getDashboardStats result:", result);
    return result;
  }

  async getLandingPageStats(): Promise<{ doctors: number, patients: number, appointments: number }> {
    const allDoctors = await this._doctorRepository.findAllActive();
    const verifiedDoctors = allDoctors.filter(d => d.verificationStatus === VerificationStatus.Approved);

    const doctorCount = verifiedDoctors.length;

    const { total: patientCount } = await this._userRepository.getAllPatients(0, 1, { isActive: true });


    const completedAppointments = await this._appointmentRepository.countByStatus('completed');

    return {
      doctors: doctorCount,
      patients: patientCount,
      appointments: completedAppointments
    };
  }
}
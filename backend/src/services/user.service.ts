import { IUserService } from "./interfaces/IUserService";
import { UserResponseDTO, UnifiedUserProfileResponseDTO, UnifiedUpdateProfileDTO } from "../dtos/user.dtos/user.dto";
import { UserMapper } from "../mappers/user.mapper";
import { IUserDocument } from "../types/user.type";
import { IDoctorDocument } from "../types/doctor.type";
import { AppointmentListItem } from "../types/common";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { MESSAGES, ROLES } from "../constants/constants";

export class UserService implements IUserService {
  constructor(
    private _userRepository: IUserRepository,
    private _doctorRepository: IDoctorRepository
  ) { }

  async getUserProfile(userId: string): Promise<UnifiedUserProfileResponseDTO> {
    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    let doctor = null;
    if (user.role === ROLES.DOCTOR) {
      doctor = await this._doctorRepository.findByUserId(userId);
    }

    return UserMapper.toUnifiedProfileDTO(user, doctor);
  }

  async updateUserProfile(userId: string, data: UnifiedUpdateProfileDTO, imageFile?: Express.Multer.File): Promise<UnifiedUserProfileResponseDTO> {
    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    const info = data.information || {};
    const additionalInfo = data.additionalInformation || {};

    if (info.phone && info.phone.length < 10) {
      throw new ValidationError(MESSAGES.INVALID_PHONE_NUMBER);
    }

    if (info.name && info.name.trim().length < 2) {
      throw new ValidationError(MESSAGES.INVALID_NAME);
    }

    const updateData: Partial<IUserDocument> & { dob?: Date } = {};
    if (info.name) updateData.name = info.name;
    if (info.phone) updateData.phone = info.phone;
    if (info.gender) updateData.gender = info.gender;
    if (imageFile) {
      updateData.profileImage = imageFile.path;
    } else if (info.profileImage) {
      updateData.profileImage = info.profileImage;
    }
    if (info.dob) {
      updateData.dob = typeof info.dob === 'string' ? new Date(info.dob) : info.dob;
    }

    await this._userRepository.updateById(userId, updateData);

    let doctor = null;
    if (user.role === ROLES.DOCTOR) {
      doctor = await this._doctorRepository.findByUserId(userId);
      if (doctor) {
        const doctorUpdates: Partial<IDoctorDocument> & {
          specialty?: string;
          qualifications?: string[];
          experienceYears?: number;
          VideoFees?: number;
          ChatFees?: number;
          languages?: string[];
          licenseNumber?: string;
          about?: string;
        } = {};
        if (additionalInfo.specialty) doctorUpdates.specialty = additionalInfo.specialty;
        if (additionalInfo.qualifications) doctorUpdates.qualifications = additionalInfo.qualifications;
        if (additionalInfo.experienceYears) doctorUpdates.experienceYears = additionalInfo.experienceYears;
        if (additionalInfo.VideoFees) doctorUpdates.VideoFees = additionalInfo.VideoFees;
        if (additionalInfo.ChatFees) doctorUpdates.ChatFees = additionalInfo.ChatFees;
        if (additionalInfo.languages) doctorUpdates.languages = additionalInfo.languages;
        if (additionalInfo.licenseNumber) doctorUpdates.licenseNumber = additionalInfo.licenseNumber;
        if (additionalInfo.about) doctorUpdates.about = additionalInfo.about;

        if (Object.keys(doctorUpdates).length > 0) {
          await this._doctorRepository.updateById(doctor._id, doctorUpdates);
        }
      }
    }


    const updatedUser = await this._userRepository.findById(userId);
    if (user.role === ROLES.DOCTOR) {
      doctor = await this._doctorRepository.findByUserId(userId);
    }

    return UserMapper.toUnifiedProfileDTO(updatedUser!, doctor);
  }

  async deleteUserAccount(userId: string): Promise<void> {
    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }
    await this._userRepository.updateById(userId, { isActive: false });
  }

  async getUserAppointments(userId: string): Promise<AppointmentListItem[]> {
    return [];
  }

  async toggleFavoriteDoctor(userId: string, doctorId: string): Promise<boolean> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new NotFoundError(MESSAGES.USER_NOT_FOUND);

    const favorites = user.favorites || [];
    const index = favorites.findIndex(id => id.toString() === doctorId);

    let isAdded = false;
    if (index === -1) {
      favorites.push(doctorId as any);
      isAdded = true;
    } else {
      favorites.splice(index, 1);
      isAdded = false;
    }

    await this._userRepository.updateById(userId, { favorites });
    return isAdded;
  }

  async getFavoriteDoctors(userId: string): Promise<any[]> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new NotFoundError(MESSAGES.USER_NOT_FOUND);

    // We need to populate the favorites
    // If our repository doesn't support populate on findById, we might need a workaround or add it.
    // Let's assume user.populate exists or use repository.
    const populatedUser = await (this._userRepository as any).model
      .findById(userId)
      .populate({
        path: 'favorites',
        populate: {
          path: 'userId',
          select: 'name email profileImage'
        }
      });

    return populatedUser?.favorites || [];
  }
}

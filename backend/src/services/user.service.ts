import { IUserService } from "./interfaces/IUserService";
import { UserResponseDTO, UnifiedUserProfileResponseDTO, UnifiedUpdateProfileDTO } from "../dtos/user.dtos/user.dto";
import { UserMapper } from "../mappers/user.mapper";
import { IUserDocument } from "../types/user.type";
import { AppointmentListItem } from "../types/common";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { MESSAGES, ROLES } from "../constants/constants";

export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private doctorRepository: IDoctorRepository
  ) { }

  async getUserProfile(userId: string): Promise<UnifiedUserProfileResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    let doctor = null;
    if (user.role === ROLES.DOCTOR) {
      doctor = await this.doctorRepository.findByUserId(userId);
    }

    return UserMapper.toUnifiedProfileDTO(user, doctor);
  }

  async updateUserProfile(userId: string, data: UnifiedUpdateProfileDTO, imageFile?: Express.Multer.File): Promise<UnifiedUserProfileResponseDTO> {
    const user = await this.userRepository.findById(userId);
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

    await this.userRepository.updateById(userId, updateData);

    let doctor = null;
    if (user.role === ROLES.DOCTOR) {
      doctor = await this.doctorRepository.findByUserId(userId);
      if (doctor) {
        const doctorUpdates: any = {};
        if (additionalInfo.specialty) doctorUpdates.specialty = additionalInfo.specialty;
        if (additionalInfo.qualifications) doctorUpdates.qualifications = additionalInfo.qualifications;
        if (additionalInfo.experienceYears) doctorUpdates.experienceYears = additionalInfo.experienceYears;
        if (additionalInfo.VideoFees) doctorUpdates.VideoFees = additionalInfo.VideoFees;
        if (additionalInfo.ChatFees) doctorUpdates.ChatFees = additionalInfo.ChatFees;
        if (additionalInfo.languages) doctorUpdates.languages = additionalInfo.languages;
        if (additionalInfo.licenseNumber) doctorUpdates.licenseNumber = additionalInfo.licenseNumber;
        if (additionalInfo.about) doctorUpdates.about = additionalInfo.about;

        if (Object.keys(doctorUpdates).length > 0) {
          await this.doctorRepository.updateById(doctor._id, doctorUpdates);
        }
      }
    }


    const updatedUser = await this.userRepository.findById(userId);
    if (user.role === ROLES.DOCTOR) {
      doctor = await this.doctorRepository.findByUserId(userId);
    }

    return UserMapper.toUnifiedProfileDTO(updatedUser!, doctor);
  }

  async deleteUserAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }
    await this.userRepository.updateById(userId, { isActive: false });
  }

  async getUserAppointments(userId: string): Promise<AppointmentListItem[]> {
    return [];
  }
}

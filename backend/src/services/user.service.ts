import { UserRepository } from "../repositories/user.repository";
import type { IUserService } from "./interfaces/IUserService";
import type { UserResponseDTO, UpdateUserProfileDTO } from "../dtos/user.dtos/user.dto";
import mapUserToResponse from "../mappers/user.mapper/user.mapper";
import type { IUserDocument } from "../types/user.type";
import type { AppointmentListItem } from "../types/common";

export class UserService implements IUserService {
  private userRepository: UserRepository; //=

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository || new UserRepository(); //=
  }


  async getUserProfile(userId: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "patient") {
      throw new Error("Invalid user type");
    }

    return mapUserToResponse(user);
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileDTO): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "patient") {
      throw new Error("Invalid user type");
    }


    if (data.phone && data.phone.length < 10) {
      throw new Error("Invalid phone number");
    }

    if (data.name && data.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    const updateData: Partial<IUserDocument> & { dob?: Date } = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.gender) updateData.gender = data.gender;
    if (data.profileImage) updateData.profileImage = data.profileImage;
    if (data.dob) {
      updateData.dob = typeof data.dob === 'string' ? new Date(data.dob) : data.dob;
    }

    const updatedUser = await this.userRepository.updateById(userId, updateData);

    if (!updatedUser) {
      throw new Error("Failed to update user profile");
    }

    return mapUserToResponse(updatedUser);
  }

  async deleteUserAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    await this.userRepository.updateById(userId, { isActive: false });
  }

  async getUserAppointments(userId: string): Promise<AppointmentListItem[]> {

    return [];
  }
}

import { UserResponseDTO, UpdateUserProfileDTO } from "dtos/user.dtos/user.dto";
import type { AppointmentListItem } from "../../types/common";

export interface IUserService {
  getUserProfile(userId: string): Promise<UserResponseDTO>;
  updateUserProfile(userId: string, data: UpdateUserProfileDTO): Promise<UserResponseDTO>;
  deleteUserAccount(userId: string): Promise<void>;
  getUserAppointments(userId: string): Promise<AppointmentListItem[]>;
}

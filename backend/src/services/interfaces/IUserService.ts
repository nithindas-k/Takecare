import { UserResponseDTO, UnifiedUpdateProfileDTO, UnifiedUserProfileResponseDTO } from "dtos/user.dtos/user.dto";
import type { AppointmentListItem } from "../../types/common";

export interface IUserService {
  getUserProfile(userId: string): Promise<UnifiedUserProfileResponseDTO>;
  updateUserProfile(userId: string, data: UnifiedUpdateProfileDTO, imageFile?: Express.Multer.File): Promise<UnifiedUserProfileResponseDTO>;
  deleteUserAccount(userId: string): Promise<void>;
  getUserAppointments(userId: string): Promise<AppointmentListItem[]>;
}

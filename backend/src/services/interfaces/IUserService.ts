import { UnifiedUpdateProfileDTO, UnifiedUserProfileResponseDTO } from "../../dtos/user.dtos/user.dto";
import type { AppointmentListItem } from "../../types/common";
import { DoctorPublicDTO } from "./IDoctorService";

export interface IUserService {
  getUserProfile(userId: string): Promise<UnifiedUserProfileResponseDTO>;
  updateUserProfile(userId: string, data: UnifiedUpdateProfileDTO, imageFile?: Express.Multer.File): Promise<UnifiedUserProfileResponseDTO>;
  deleteUserAccount(userId: string): Promise<void>;
  getUserAppointments(userId: string): Promise<AppointmentListItem[]>;
  toggleFavoriteDoctor(userId: string, doctorId: string): Promise<boolean>;
  getFavoriteDoctors(userId: string): Promise<DoctorPublicDTO[]>;
}

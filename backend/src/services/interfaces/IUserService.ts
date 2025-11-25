import { UserResponseDTO } from "dtos/user.dtos/user.dto";

export interface IUserService {
  getUserProfile(userId: string): Promise<UserResponseDTO>;
  updateUserProfile(userId: string, data: UpdateUserProfileDTO): Promise<UserResponseDTO>;
  deleteUserAccount(userId: string): Promise<void>;
  getUserAppointments(userId: string): Promise<any[]>;
}

export interface UpdateUserProfileDTO {
  name?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  dob?: string | Date;  // ✅ Accept both string and Date
  profileImage?: string;
}

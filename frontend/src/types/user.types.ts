import type { Gender } from "./common.types";

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "patient";
  gender?: Gender | null;
  dob?: string | null;
  profileImage?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;  
}

export interface UpdateUserProfileRequest {
  name?: string;
  phone?: string;
  gender?: Gender;
  dob?: string;
  profileImage?: string;
}

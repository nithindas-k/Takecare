export interface LoginAdminDTO {
  email: string;
  password: string;
}

export interface AdminResponseDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string | null;
  phone?: string | null;
}

export interface AuthResponseDTO {
  user: AdminResponseDTO;
  token: string;
}

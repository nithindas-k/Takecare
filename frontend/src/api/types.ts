  export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
  }

  export interface RegisterUserData {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    gender?: "male" | "female" | "other";
    dob?: string;
  }

  export interface UserData {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    gender?: string | null;
    dob?: string | null;
    profileImage?: string | null;
    isActive: boolean;
  }

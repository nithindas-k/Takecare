import axiosInstance from "../api/axiosInstance";
import {
  USER_API_ROUTES,
  DOCTOR_API_ROUTES,
  ADMIN_API_ROUTES,
  AUTH_BASE_URL,
  AUTH_ROUTES,
} from "../utils/constants";

import type {
  LoginRequest,
  AuthUser,
  RegisterRequest,
  OtpRequest,
} from "../types";


interface JwtPayload {
  userId: string;
  id: string;
  role: 'patient' | 'doctor' | 'admin';
  exp: number;
  email: string;
  name?: string;
  profileImage?: string;
  doctorId?: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiErrorResponse;
  return apiError.response?.data?.message || "An error occurred";
}

class AuthService {
  private getApiRoutes(role: "user" | "doctor") {
    return role === "doctor" ? DOCTOR_API_ROUTES : USER_API_ROUTES;
  }

  private decodeToken<T = JwtPayload>(token: string): T | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as T;
    } catch (error) {
      console.error('Failed to decode token', error);
      return null;
    }
  }


  private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken<{ exp: number }>(token);
    if (!decoded) return true;
    return decoded.exp * 1000 < Date.now();
  }


  saveToken(token: string): void {
    localStorage.setItem("authToken", token);
  }


  getToken(): string | null {
    return localStorage.getItem("authToken");
  }


  getCurrentUserInfo(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    const decoded = this.decodeToken<JwtPayload>(token);
    if (!decoded) return null;

    return {
      ...decoded,
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id,
    } as JwtPayload;
  }


  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!(token && !this.isTokenExpired(token));
  }

  async userRegister(userData: RegisterRequest) {
    try {
      const response = await axiosInstance.post(
        USER_API_ROUTES.REGISTER,
        userData
      );
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Registration failed",
      };
    }
  }

  async userVerifyOtp(otpData: OtpRequest) {
    try {
      const response = await axiosInstance.post(
        USER_API_ROUTES.VERIFY_OTP,
        otpData
      );
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "OTP verification failed",
      };
    }
  }

  // USER resend OTP
  async userResendOtp(email: string) {
    try {
      const response = await axiosInstance.post(USER_API_ROUTES.RESEND_OTP, {
        email,
      });
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Failed to resend OTP",
      };
    }
  }

  async userLogin(credentials: LoginRequest) {
    try {
      const response = await axiosInstance.post(
        USER_API_ROUTES.LOGIN,
        credentials
      );
      if (response.data?.data?.token) {
        this.saveToken(response.data.data.token);
      } else if (response.data?.token) {
        this.saveToken(response.data.token);
      }
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Login failed",
      };
    }
  }

  userGoogleLogin(): void {
    window.location.href = `${AUTH_BASE_URL}${AUTH_ROUTES.USER_GOOGLE_LOGIN}`;
  }

  async doctorRegister(doctorData: RegisterRequest) {
    try {
      const response = await axiosInstance.post(
        DOCTOR_API_ROUTES.REGISTER,
        doctorData
      );
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Registration failed",
      };
    }
  }

  async doctorVerifyOtp(otpData: OtpRequest) {
    try {
      const response = await axiosInstance.post(
        DOCTOR_API_ROUTES.VERIFY_OTP,
        otpData
      );
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "OTP verification failed",
      };
    }
  }

  async doctorResendOtp(email: string) {
    try {
      const response = await axiosInstance.post(DOCTOR_API_ROUTES.RESEND_OTP, {
        email,
      });
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Failed to resend OTP",
      };
    }
  }

  async doctorLogin(credentials: LoginRequest) {
    try {
      const response = await axiosInstance.post(
        DOCTOR_API_ROUTES.LOGIN,
        credentials
      );
      if (response.data?.data?.token) {
        this.saveToken(response.data.data.token);
      } else if (response.data?.token) {
        this.saveToken(response.data.token);
      }
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Login failed",
      };
    }
  }

  doctorGoogleLogin(): void {
    window.location.href = `${AUTH_BASE_URL}${AUTH_ROUTES.DOCTOR_GOOGLE_LOGIN}`;
  }

  async adminLogin(credentials: LoginRequest) {
    try {
      const response = await axiosInstance.post(
        ADMIN_API_ROUTES.LOGIN,
        credentials
      );
      if (response.data?.data?.token) {
        this.saveToken(response.data.data.token);
      } else if (response.data?.token) {
        this.saveToken(response.data.token);
      }
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Admin login failed",
      };
    }
  }

  async logout() {
    try {
      await axiosInstance.get(AUTH_ROUTES.LOGOUT);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("authToken");
    }
  }


  getCurrentUser(): AuthUser | null {
    console.warn('getCurrentUser is deprecated. Use getCurrentUserInfo() instead.');
    const userInfo = this.getCurrentUserInfo();
    if (!userInfo) return null;

    return {
      id: userInfo.id,
      _id: userInfo.id,
      email: userInfo.email,
      role: userInfo.role,
      name: userInfo.name || '',
    } as unknown as AuthUser;
  }


  saveUser(_user: any): void {
    console.warn('saveUser is deprecated. User data should not be stored in localStorage.');
  }


  async forgotPassword(
    email: string,
    role: "user" | "doctor" = "user") {
    const apiRoutes = this.getApiRoutes(role);
    try {
      const response = await axiosInstance.post(apiRoutes.FORGOT_PASSWORD, {
        email,
      });
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Failed to send reset link",
      };
    }
  }

  async verifyForgotOtp(
    email: string,
    otp: string,
    role: "user" | "doctor" = "user"
  ) {
    const apiRoutes = this.getApiRoutes(role);
    try {
      const response = await axiosInstance.post(apiRoutes.VERIFY_OTP_PASSWORD, {
        email,
        otp,
      });
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "OTP verification failed",
      };
    }
  }

  async resendOtp(email: string, role: "user" | "doctor" = "user") {
    const apiRoutes = this.getApiRoutes(role);
    try {
      const response = await axiosInstance.post(apiRoutes.RESEND_OTP, {
        email,
      });
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Failed to resend OTP",
      };
    }
  }

  async resetPassword(
    data: {
      email: string;
      resetToken: string;
      newPassword: string;
      confirmPassword: string;
    },
    role: "user" | "doctor" = "user"
  ) {
    const apiRoutes = this.getApiRoutes(role);
    try {
      const response = await axiosInstance.post(apiRoutes.RESET_PASSWORD, data);
      return response.data;
    } catch (error: unknown) {
      return {
        success: false,
        message: getErrorMessage(error) || "Failed to reset password",
      };
    }
  }
}

export default new AuthService();




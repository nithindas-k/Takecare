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
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types";

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
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("doctor");
    localStorage.removeItem("admin");
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("authToken");
  }

  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as AuthUser;
    } catch {
      return null;
    }
  }

  saveUser(user: AuthUser): void {
    localStorage.setItem("user", JSON.stringify(user));
  }

  saveToken(token: string): void {
    localStorage.setItem("authToken", token);
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



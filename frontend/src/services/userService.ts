

import axiosInstance from "../api/axiosInstance";
import { USER_API_ROUTES, ADMIN_API_ROUTES } from "../utils/constants";
import type { UserData } from "../api/types";

class UserService {
  async getProfile() {
    try {
      const response = await axiosInstance.get(USER_API_ROUTES.PROFILE);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch profile",
      };
    }
  }

  async updateProfile(userData: Partial<UserData> | FormData) {
    try {
      const isFormData = userData instanceof FormData;
      const config = isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};

      const response = await axiosInstance.put(USER_API_ROUTES.PROFILE, userData, config);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  }

  async uploadProfileImage(file: File) {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axiosInstance.post(USER_API_ROUTES.UPDATE_IMAGE, formData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to upload image",
      };
    }
  }


  async getAllUsers() {
    try {
      const response = await axiosInstance.get(ADMIN_API_ROUTES.GET_ALL_USERS);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch users",
      };
    }
  }

  async deleteUser(userId: string) {
    try {
      const response = await axiosInstance.delete(ADMIN_API_ROUTES.DELETE_USER(userId));
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete user",
      };
    }
  }

  async toggleFavorite(doctorId: string) {
    try {
      const response = await axiosInstance.post(USER_API_ROUTES.TOGGLE_FAVORITE(doctorId));
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to toggle favorite",
      };
    }
  }

  async getFavorites() {
    try {
      const response = await axiosInstance.get(USER_API_ROUTES.GET_FAVORITES);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch favorites",
      };
    }
  }
}

export default new UserService();


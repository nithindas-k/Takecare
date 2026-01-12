/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/userService.ts

import axiosInstance from "../api/axiosInstance";
import type { UserData } from "../api/types";

class UserService {
  async getProfile() {
    try {
      const response = await axiosInstance.get("/users/profile");
      return response.data;
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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

      const response = await axiosInstance.put("/users/profile", userData, config);
      return response.data;
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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
      const response = await axiosInstance.post("/users/profile/image", formData);
      return response.data;
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to upload image",
      };
    }
  }

 
  async getAllUsers() {
    try {
      const response = await axiosInstance.get("/admin/users");
      return response.data;
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch users",
      };
    }
  }

  async deleteUser(userId: string) {
    try {
      const response = await axiosInstance.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete user",
      };
    }
  }
}

export default new UserService();


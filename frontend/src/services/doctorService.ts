// src/services/doctorService.ts

import axiosInstance from "../api/axiosInstance";
import { DOCTOR_API_ROUTES } from "../utils/constants";

class DoctorService {
  async submitVerification(formData: FormData){
    try {
      const response = await axiosInstance.post(DOCTOR_API_ROUTES.VERIFICATION, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Verification submission failed",
      };
    }
  }

  async getDoctorProfile() {
    try {
      const response = await axiosInstance.get(DOCTOR_API_ROUTES.PROFILE);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch doctor profile",
      };
    }
  }
}

export default new DoctorService();

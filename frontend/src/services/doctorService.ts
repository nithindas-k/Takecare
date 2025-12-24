// src/services/doctorService.ts

import axiosInstance from "../api/axiosInstance";
import { DOCTOR_API_ROUTES } from "../utils/constants";

class DoctorService {
  async getVerificationFormData() {
    try {
      const response = await axiosInstance.get(DOCTOR_API_ROUTES.VERIFICATION);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch verification data",
      };
    }
  }

  // async submitVerification(formData: FormData) {
  //   try {
  //     const response = await axiosInstance.post(DOCTOR_API_ROUTES.VERIFICATION, formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });
  //     return response.data;
  //   } catch (error: any) {
  //     return {
  //       success: false,
  //       message: error.response?.data?.message || "Verification submission failed",
  //     };
  //   }
  // }

  async submitVerification(formData: FormData) {
    try {
      const response = await axiosInstance.post(DOCTOR_API_ROUTES.SUBMIT_VERIFICATION, formData, {
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

  async updateProfile(formData: FormData) {
    try {
      const response = await axiosInstance.put(DOCTOR_API_ROUTES.PROFILE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  }

  // Schedule methods
  async createSchedule(scheduleData: any) {
    try {
      const response = await axiosInstance.post(DOCTOR_API_ROUTES.SCHEDULE, scheduleData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create schedule",
      };
    }
  }

  async getSchedule(doctorId?: string) {
    try {
      const url = doctorId ? DOCTOR_API_ROUTES.SCHEDULE_BY_ID(doctorId) : DOCTOR_API_ROUTES.SCHEDULE;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch schedule",
      };
    }
  }

  async updateSchedule(scheduleData: any, doctorId?: string) {
    try {
      console.log("===================" + doctorId)
      const url = doctorId ? `${DOCTOR_API_ROUTES.SCHEDULE_BY_ID(doctorId)}` : DOCTOR_API_ROUTES.SCHEDULE;
      const response = await axiosInstance.put(url, scheduleData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update schedule",
      };
    }
  }

  async blockDate(date: string, reason?: string, doctorId?: string) {
    try {
      const url = DOCTOR_API_ROUTES.BLOCK_DATE(doctorId);
      const response = await axiosInstance.post(url, { date, reason });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to block date",
      };
    }
  }

  async unblockDate(date: string, doctorId?: string) {
    try {
      const url = DOCTOR_API_ROUTES.UNBLOCK_DATE(doctorId);
      const response = await axiosInstance.delete(url, { data: { date } });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to unblock date",
      };
    }
  }

  async getAvailableSlots(doctorId: string, date: string) {
    try {
      const response = await axiosInstance.get(DOCTOR_API_ROUTES.AVAILABLE_SLOTS(doctorId), {
        params: { date },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch available slots",
      };
    }
  }

  async getAllDoctors(params: { page?: number; limit?: number; query?: string; specialty?: string; sort?: string; experience?: number; rating?: number }) {
    try {
      const response = await axiosInstance.get('/doctors', {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          query: params.query || '',
          specialty: params.specialty || '',
          sort: params.sort || '',
          experience: params.experience,
          rating: params.rating,
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch doctors",
      };
    }
  }

  async getDoctorById(doctorId: string) {
    try {
      const response = await axiosInstance.get(`/doctors/${doctorId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch doctor details",
      };
    }
  }

  async getRelatedDoctors(doctorId: string) {
    try {
      const response = await axiosInstance.get(`/doctors/${doctorId}/related`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch related doctors",
      };
    }
  }
}

export default new DoctorService();

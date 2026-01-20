
import axiosInstance from "../api/axiosInstance";
import { DOCTOR_API_ROUTES } from "../utils/constants";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

class DoctorService {
  async getVerificationFormData() {
    try {
      const response = await axiosInstance.get(DOCTOR_API_ROUTES.VERIFICATION);
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch verification data",
      };
    }
  }

  async submitVerification(formData: FormData) {
    try {
      const response = await axiosInstance.post(DOCTOR_API_ROUTES.SUBMIT_VERIFICATION, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Verification submission failed",
      };
    }
  }

  async getDoctorProfile() {
    try {
      const response = await axiosInstance.get(DOCTOR_API_ROUTES.PROFILE);
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch doctor profile",
      };
    }
  }

  async updateProfile(formData: FormData) {
    try {
      const response = await axiosInstance.put(DOCTOR_API_ROUTES.PROFILE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to update profile",
      };
    }
  }


  async createSchedule(scheduleData: unknown) {
    try {
      const response = await axiosInstance.post(DOCTOR_API_ROUTES.SCHEDULE, scheduleData);
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to create schedule",
      };
    }
  }

  async getSchedule(doctorId?: string) {
    try {
      const url = doctorId ? DOCTOR_API_ROUTES.SCHEDULE_BY_ID(doctorId) : DOCTOR_API_ROUTES.SCHEDULE;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch schedule",
      };
    }
  }

  async updateSchedule(scheduleData: unknown, doctorId?: string) {
    try {
      const url = doctorId ? `${DOCTOR_API_ROUTES.SCHEDULE_BY_ID(doctorId)}` : DOCTOR_API_ROUTES.SCHEDULE;
      const response = await axiosInstance.put(url, scheduleData);
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to update schedule",
      };
    }
  }

  async blockDate(date: string, reason?: string, doctorId?: string, slots?: string[]) {
    try {
      const url = DOCTOR_API_ROUTES.BLOCK_DATE(doctorId);
      const response = await axiosInstance.post(url, { date, reason, slots });
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to block date",
      };
    }
  }

  async unblockDate(date: string, doctorId?: string) {
    try {
      const url = DOCTOR_API_ROUTES.UNBLOCK_DATE(doctorId);
      const response = await axiosInstance.delete(url, { data: { date } });
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to unblock date",
      };
    }
  }

  async getAvailableSlots(doctorId: string, date: string) {
    try {
      const response = await axiosInstance.get(DOCTOR_API_ROUTES.AVAILABLE_SLOTS(doctorId), {
        params: { date },
      });
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch available slots",
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
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch doctors",
      };
    }
  }

  async getDoctorById(doctorId: string) {
    try {
      const response = await axiosInstance.get(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch doctor details",
      };
    }
  }

  async getRelatedDoctors(doctorId: string) {
    try {
      const response = await axiosInstance.get(`/doctors/${doctorId}/related`);
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch related doctors",
      };
    }
  }

  async getDashboardStats(startDate?: string, endDate?: string) {
    try {
      const response = await axiosInstance.get("/doctors/stats", {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch dashboard stats",
      };
    }
  }


  async addRecurringSlots(recurringData: { startTime: string; endTime: string; days: string[]; skipOverlappingDays?: boolean }) {
    try {
      const response = await axiosInstance.post(DOCTOR_API_ROUTES.RECURRING_SLOTS, recurringData);
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to add recurring slots",
      };
    }
  }

  async deleteRecurringSlot(day: string, slotId: string) {
    try {
      const response = await axiosInstance.delete(DOCTOR_API_ROUTES.DELETE_RECURRING_SLOT(day, slotId));
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to delete recurring slot",
      };
    }
  }

  async deleteRecurringSlotByTime(startTime: string, endTime: string) {
    try {
      const response = await axiosInstance.delete(DOCTOR_API_ROUTES.DELETE_RECURRING_SLOT_BY_TIME(startTime, endTime));
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to delete recurring slots from all days",
      };
    }
  }

  async getLandingStats() {
    try {
      const response = await axiosInstance.get('/doctors/landing-stats');
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch landing stats",
      };
    }
  }
}

export default new DoctorService();

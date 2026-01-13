import axiosInstance from "../api/axiosInstance";
import { ADMIN_API_ROUTES } from "../utils/constants";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

class AdminService {
  async fetchDoctorRequests() {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_DOCTOR_REQUESTS);
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error", data: [] };
    }
  }

  async fetchDoctorRequestDetails(doctorId: string) {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_DOCTOR_BY_ID(doctorId));
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error" };
    }
  }

  async approveDoctor(doctorId: string) {
    try {
      const res = await axiosInstance.post(ADMIN_API_ROUTES.APPROVE_DOCTOR(doctorId));
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Approve failed" };
    }
  }

  async rejectDoctor(doctorId: string, reason: string) {
    try {
      const res = await axiosInstance.post(ADMIN_API_ROUTES.REJECT_DOCTOR(doctorId), { reason });
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Reject failed" };
    }
  }

  async getAllDoctors(page: number = 1, limit: number = 10, filters: { search?: string; specialty?: string; verificationStatus?: string; isActive?: boolean | string } = {}) {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_ALL_DOCTORS, {
        params: { page, limit, ...filters }
      });
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error", data: [] };
    }
  }

  async banDoctor(doctorId: string) {
    try {
      const res = await axiosInstance.post(`${ADMIN_API_ROUTES.GET_ALL_DOCTORS}/${doctorId}/ban`);
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error banning doctor" };
    }
  }

  async unbanDoctor(doctorId: string) {
    try {
      const res = await axiosInstance.post(`${ADMIN_API_ROUTES.GET_ALL_DOCTORS}/${doctorId}/unban`);
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error unbanning doctor" };
    }
  }

  async getAllPatients(page: number = 1, limit: number = 10, filters: { search?: string; isActive?: boolean | string } = {}) {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_ALL_PATIENTS, {
        params: { page, limit, ...filters }
      });
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error fetching patients", data: [] };
    }
  }

  async getPatientById(patientId: string) {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_PATIENT_BY_ID(patientId));
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error fetching patient details" };
    }
  }

  async blockPatient(patientId: string) {
    try {
      const res = await axiosInstance.post(ADMIN_API_ROUTES.BLOCK_PATIENT(patientId));
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error blocking patient" };
    }
  }

  async unblockPatient(patientId: string) {
    try {
      const res = await axiosInstance.post(ADMIN_API_ROUTES.UNBLOCK_PATIENT(patientId));
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error unblocking patient" };
    }
  }

  async getDashboardStats(startDate?: string, endDate?: string) {
    try {
      const response = await axiosInstance.get("/admin/stats", {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error fetching dashboard stats" };
    }
  }

  async getAllReviews(page: number = 1, limit: number = 10) {
    try {
      const res = await axiosInstance.get("/reviews", {
        params: { page, limit }
      });
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error fetching reviews", data: { reviews: [], total: 0, totalPages: 0 } };
    }
  }

  async deleteReview(reviewId: string) {
    try {
      const res = await axiosInstance.delete(`/reviews/admin/${reviewId}`);
      return res.data;
    } catch (error) {
      const err = error as ApiError;
      return { success: false, message: err.response?.data?.message || err.message || "Error deleting review" };
    }
  }
}

export default new AdminService();

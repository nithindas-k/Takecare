import axiosInstance from "../api/axiosInstance";
import { ADMIN_API_ROUTES } from "../utils/constants";

class AdminService {
  async fetchDoctorRequests() {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_DOCTOR_REQUESTS);
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error", data: [] };
    }
  }

  async fetchDoctorRequestDetails(doctorId: string) {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_DOCTOR_BY_ID(doctorId));
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error" };
    }
  }

  async approveDoctor(doctorId: string) {
    try {
      const res = await axiosInstance.post(ADMIN_API_ROUTES.APPROVE_DOCTOR(doctorId));
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Approve failed" };
    }
  }

  async rejectDoctor(doctorId: string, reason: string) {
    try {
      const res = await axiosInstance.post(ADMIN_API_ROUTES.REJECT_DOCTOR(doctorId), { reason });
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Reject failed" };
    }
  }

  async getAllDoctors(page: number = 1, limit: number = 10, filters: { search?: string; specialty?: string; verificationStatus?: string; isActive?: boolean | string } = {}) {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_ALL_DOCTORS, {
        params: { page, limit, ...filters }
      });
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error", data: [] };
    }
  }


  async banDoctor(doctorId: string) {
    try {
      const res = await axiosInstance.post(`${ADMIN_API_ROUTES.GET_ALL_DOCTORS}/${doctorId}/ban`);
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error banning doctor" };
    }
  }

  async unbanDoctor(doctorId: string) {
    try {
      const res = await axiosInstance.post(`${ADMIN_API_ROUTES.GET_ALL_DOCTORS}/${doctorId}/unban`);
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error unbanning doctor" };
    }
  }

  async getAllPatients(page: number = 1, limit: number = 10, filters: { search?: string; isActive?: boolean | string } = {}) {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_ALL_PATIENTS, {
        params: { page, limit, ...filters }
      });
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error fetching patients", data: [] };
    }
  }

  async getPatientById(patientId: string) {
    try {
      const res = await axiosInstance.get(ADMIN_API_ROUTES.GET_PATIENT_BY_ID(patientId));
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error fetching patient details" };
    }
  }

  async blockPatient(patientId: string) {
    try {
      const res = await axiosInstance.post(ADMIN_API_ROUTES.BLOCK_PATIENT(patientId));
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error blocking patient" };
    }
  }

  async unblockPatient(patientId: string) {
    try {
      const res = await axiosInstance.post(ADMIN_API_ROUTES.UNBLOCK_PATIENT(patientId));
      return res.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Error unblocking patient" };
    }
  }
}

export default new AdminService();

import axiosInstance from "../api/axiosInstance";
import { APPOINTMENT_API_ROUTES } from "../utils/constants";
import type { AppointmentData, AppointmentFilters } from "../types/appointment.types";

export const appointmentService = {

    createAppointment: async (appointmentData: AppointmentData) => {
        const response = await axiosInstance.post(
            APPOINTMENT_API_ROUTES.CREATE,
            appointmentData
        );
        return response.data;
    },


    getMyAppointments: async (status?: string, page: number = 1, limit: number = 10) => {
        const response = await axiosInstance.get(APPOINTMENT_API_ROUTES.MY_APPOINTMENTS, {
            params: { status, page, limit },
        });
        return response.data;
    },


    getAppointmentById: async (id: string) => {
        const response = await axiosInstance.get(APPOINTMENT_API_ROUTES.GET_BY_ID(id));
        return response.data;
    },


    cancelAppointment: async (id: string, cancellationReason: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.CANCEL(id), {
            cancellationReason,
        });
        return response.data;
    },

    getDoctorRequests: async (page: number = 1, limit: number = 10) => {
        const response = await axiosInstance.get(APPOINTMENT_API_ROUTES.DOCTOR_REQUESTS, {
            params: { page, limit },
        });
        return response.data;
    },


    getDoctorAppointments: async (status?: string, page: number = 1, limit: number = 10) => {
        const response = await axiosInstance.get(APPOINTMENT_API_ROUTES.DOCTOR_LIST, {
            params: { status, page, limit },
        });
        return response.data;
    },

    approveAppointment: async (id: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.APPROVE(id));
        return response.data;
    },

    // Doctor: Reject
    rejectAppointment: async (id: string, rejectionReason: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.REJECT(id), {
            rejectionReason,
        });
        return response.data;
    },

    // Doctor: Complete
    completeAppointment: async (id: string, completionData: { doctorNotes?: string; prescriptionUrl?: string }) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.COMPLETE(id), completionData);
        return response.data;
    },

    rescheduleAppointment: async (id: string, rescheduleData: { appointmentDate: Date | string, appointmentTime: string, slotId?: string }) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.RESCHEDULE(id), rescheduleData);
        return response.data;
    },

    // Admin: Get All
    getAllAppointments: async (page: number = 1, limit: number = 10, filters: AppointmentFilters = {}) => {
        const response = await axiosInstance.get(APPOINTMENT_API_ROUTES.ADMIN_ALL, {
            params: { page, limit, ...filters },
        });
        return response.data;
    },

    updateSessionStatus: async (id: string, status: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.UPDATE_SESSION_STATUS(id), {
            status,
        });
        return response.data;
    },

    enablePostConsultationChat: async (id: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.ENABLE_CHAT(id));
        return response.data;
    },

    disablePostConsultationChat: async (id: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.DISABLE_CHAT(id));
        return response.data;
    },

    updateDoctorNotes: async (id: string, note: unknown) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.UPDATE_NOTES(id), { notes: note });
        return response.data;
    },

    acceptReschedule: async (id: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.ACCEPT_RESCHEDULE(id));
        return response.data;
    },

    rejectReschedule: async (id: string, reason: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.REJECT_RESCHEDULE(id), { reason });
        return response.data;
    }
};

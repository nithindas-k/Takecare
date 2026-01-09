import axiosInstance from "../api/axiosInstance";
import { PRESCRIPTION_API_ROUTES } from "../utils/constants";

export const prescriptionService = {
    createPrescription: async (prescriptionData: any) => {
        const response = await axiosInstance.post(
            PRESCRIPTION_API_ROUTES.CREATE,
            prescriptionData
        );
        return response.data;
    },

    getPrescriptionByAppointment: async (appointmentId: string) => {
        const response = await axiosInstance.get(
            PRESCRIPTION_API_ROUTES.GET_BY_APPOINTMENT(appointmentId)
        );
        return response.data;
    }
};

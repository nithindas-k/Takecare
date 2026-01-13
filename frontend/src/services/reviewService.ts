import axiosInstance from "../api/axiosInstance";
import { REVIEW_API_ROUTES } from "../utils/constants";

export interface IReviewData {
    appointmentId: string;
    doctorId: string;
    rating: number;
    comment: string;
}

export const reviewService = {
    addReview: async (data: IReviewData) => {
        const response = await axiosInstance.post(REVIEW_API_ROUTES.ADD, data);
        return response.data;
    },

    updateReview: async (reviewId: string, data: { rating?: number; comment?: string }) => {
        const response = await axiosInstance.put(REVIEW_API_ROUTES.UPDATE(reviewId), data);
        return response.data;
    },

    deleteReview: async (reviewId: string) => {
        const response = await axiosInstance.delete(REVIEW_API_ROUTES.DELETE(reviewId));
        return response.data;
    },

    getDoctorReviews: async (doctorId: string) => {
        const response = await axiosInstance.get(REVIEW_API_ROUTES.GET_DOCTOR_REVIEWS(doctorId));
        return response.data.data;
    },

    getMyReview: async (doctorId: string) => {
        const response = await axiosInstance.get(`/reviews/patient-doctor/${doctorId}`);
        return response.data;
    },

    getDoctorStats: async (doctorId: string) => {
        const response = await axiosInstance.get(REVIEW_API_ROUTES.GET_DOCTOR_STATS(doctorId));
        return response.data.data;
    }
};

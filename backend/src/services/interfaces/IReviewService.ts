import { IReview } from "../../models/review.model";

export interface IReviewService {
    addReview(data: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        rating: number;
        comment: string;
    }): Promise<IReview>;

    updateReview(reviewId: string, patientId: string, data: {
        rating?: number;
        comment?: string;
    }): Promise<IReview>;

    deleteReview(reviewId: string, patientId: string): Promise<void>;

    getDoctorReviews(doctorId: string): Promise<IReview[]>;

    getDoctorStats(doctorId: string): Promise<{ averageRating: number; reviewCount: number }>;
}

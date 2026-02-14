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

    getAllReviews(page: number, limit: number): Promise<{ reviews: IReview[]; total: number; totalPages: number }>;
    deleteReviewById(reviewId: string): Promise<void>;
    getReviewByPatientAndDoctorId(patientId: string, doctorId: string): Promise<IReview | null>;
    respondToReview(reviewId: string, userId: string, response: string): Promise<IReview>;
    getMyReviews(userId: string): Promise<IReview[]>;
    getReviewByAppointmentId(appointmentId: string): Promise<IReview | null>;
}

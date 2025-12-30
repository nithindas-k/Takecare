import { IReviewService } from "./interfaces/IReviewService";
import { IReviewRepository } from "../repositories/interfaces/IReview.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IReview } from "../models/review.model";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/constants";

export class ReviewService implements IReviewService {
    constructor(
        private _reviewRepository: IReviewRepository,
        private _doctorRepository: IDoctorRepository
    ) { }

    async addReview(data: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        rating: number;
        comment: string;
    }): Promise<IReview> {
        // Check if review already exists for this appointment
        const existing = await this._reviewRepository.findByAppointmentId(data.appointmentId);
        if (existing) {
            throw new AppError("You have already reviewed this appointment", HttpStatus.BAD_REQUEST);
        }

        const review = await this._reviewRepository.create(data as any);
        await this._updateDoctorStats(data.doctorId);
        return review;
    }

    async updateReview(reviewId: string, patientId: string, data: {
        rating?: number;
        comment?: string;
    }): Promise<IReview> {
        const review = await this._reviewRepository.findById(reviewId);
        if (!review) {
            throw new AppError("Review not found", HttpStatus.NOT_FOUND);
        }

        if (review.patientId.toString() !== patientId) {
            throw new AppError("Unauthorized to update this review", HttpStatus.FORBIDDEN);
        }

        const updatedReview = await this._reviewRepository.updateById(reviewId, data);
        if (!updatedReview) {
            throw new AppError("Failed to update review", HttpStatus.INTERNAL_ERROR);
        }

        if (data.rating) {
            await this._updateDoctorStats(review.doctorId.toString());
        }

        return updatedReview;
    }

    async deleteReview(reviewId: string, patientId: string): Promise<void> {
        const review = await this._reviewRepository.findById(reviewId);
        if (!review) {
            throw new AppError("Review not found", HttpStatus.NOT_FOUND);
        }

        if (review.patientId.toString() !== patientId) {
            throw new AppError("Unauthorized to delete this review", HttpStatus.FORBIDDEN);
        }

        await this._reviewRepository.deleteById(reviewId);
        await this._updateDoctorStats(review.doctorId.toString());
    }

    async getDoctorReviews(doctorId: string): Promise<IReview[]> {
        return await this._reviewRepository.findByDoctorId(doctorId);
    }

    async getDoctorStats(doctorId: string): Promise<{ averageRating: number; reviewCount: number }> {
        return await this._reviewRepository.getAverageRating(doctorId);
    }

    private async _updateDoctorStats(doctorId: string): Promise<void> {
        const stats = await this._reviewRepository.getAverageRating(doctorId);
        await this._doctorRepository.updateById(doctorId, {
            ratingAvg: stats.averageRating,
            ratingCount: stats.reviewCount
        } as any);
    }
}

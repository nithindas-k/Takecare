import { IReviewService } from "./interfaces/IReviewService";
import { IReviewRepository } from "../repositories/interfaces/IReview.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IReview } from "../models/review.model";
import { AppError } from "../errors/AppError";
import { HttpStatus, NOTIFICATION_TYPES } from "../constants/constants";
import { INotificationService } from "./notification.service";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";

export class ReviewService implements IReviewService {
    constructor(
        private _reviewRepository: IReviewRepository,
        private _doctorRepository: IDoctorRepository,
        private _notificationService: INotificationService,
        private _userRepository: IUserRepository
    ) { }

    async addReview(data: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        rating: number;
        comment: string;
    }): Promise<IReview> {

        const existing = await this._reviewRepository.findByAppointmentId(data.appointmentId);
        if (existing) {
            throw new AppError("You have already reviewed this appointment", HttpStatus.BAD_REQUEST);
        }


        const review = await this._reviewRepository.create(data as unknown as Partial<IReview>);
        await this._updateDoctorStats(data.doctorId);


        const doctor = await this._doctorRepository.findById(data.doctorId);
        if (doctor) {
            const patient = await this._userRepository.findById(data.patientId);
            await this._notificationService.notify(doctor.userId.toString(), {
                title: "New Review Received",
                message: `${patient?.name || "A patient"} has left a ${data.rating}-star review for you.`,
                type: NOTIFICATION_TYPES.INFO
            });
        }

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
        // Safe check: if the ID is a User ID, find the corresponding Doctor ID
        const doctorDoc = await this._doctorRepository.findByUserId(doctorId);
        const targetDoctorId = doctorDoc ? doctorDoc._id.toString() : doctorId;

        return await this._reviewRepository.findByDoctorId(targetDoctorId);
    }

    async getDoctorStats(doctorId: string): Promise<{ averageRating: number; reviewCount: number }> {
        const doctorDoc = await this._doctorRepository.findByUserId(doctorId);
        const targetDoctorId = doctorDoc ? doctorDoc._id.toString() : doctorId;
        return await this._reviewRepository.getAverageRating(targetDoctorId);
    }

    async getAllReviews(page: number, limit: number): Promise<{ reviews: IReview[]; total: number; totalPages: number }> {
        const skip = (page - 1) * limit;
        const { reviews, total } = await this._reviewRepository.getAllReviewsWithDetails(skip, limit);
        const totalPages = Math.ceil(total / limit);
        return { reviews, total, totalPages };
    }

    async deleteReviewById(reviewId: string): Promise<void> {
        const review = await this._reviewRepository.findById(reviewId);
        if (!review) {
            throw new AppError("Review not found", HttpStatus.NOT_FOUND);
        }
        await this._reviewRepository.deleteById(reviewId);
        await this._updateDoctorStats(review.doctorId.toString());
    }

    async getReviewByPatientAndDoctorId(patientId: string, doctorId: string): Promise<IReview | null> {
        return await this._reviewRepository.findByPatientIdAndDoctorId(patientId, doctorId);
    }

    private async _updateDoctorStats(doctorId: string): Promise<void> {
        const stats = await this._reviewRepository.getAverageRating(doctorId);
        await this._doctorRepository.updateById(doctorId, {
            ratingAvg: stats.averageRating,
            ratingCount: stats.reviewCount
        });
    }

    async respondToReview(reviewId: string, userId: string, response: string): Promise<IReview> {
        const doctorDoc = await this._doctorRepository.findByUserId(userId);
        if (!doctorDoc) {
            throw new AppError("Doctor profile not found", HttpStatus.NOT_FOUND);
        }

        const review = await this._reviewRepository.findById(reviewId);
        if (!review) {
            throw new AppError("Review not found", HttpStatus.NOT_FOUND);
        }

        if (review.doctorId.toString() !== doctorDoc._id.toString()) {
            throw new AppError("Unauthorized to respond to this review", HttpStatus.FORBIDDEN);
        }

        const isUpdate = !!review.response;

        const updatedReview = await this._reviewRepository.updateById(reviewId, {
            response,
            responseDate: new Date()
        });

        if (!updatedReview) {
            throw new AppError("Failed to update review with response", HttpStatus.INTERNAL_ERROR);
        }

        // Notify patient
        const doctorUser = await this._userRepository.findById(userId);
        const title = isUpdate ? "Doctor Updated Response to Review" : "Doctor Responded to Your Review";
        const message = isUpdate
            ? `Dr. ${doctorUser?.name || "Your doctor"} has updated their response to your review.`
            : `Dr. ${doctorUser?.name || "Your doctor"} has responded to your review.`;

        await this._notificationService.notify(review.patientId.toString(), {
            title,
            message,
            type: NOTIFICATION_TYPES.INFO,
            appointmentId: review.appointmentId.toString()
        });

        return updatedReview;
    }

    async getMyReviews(userId: string): Promise<IReview[]> {
        const doctorDoc = await this._doctorRepository.findByUserId(userId);
        if (doctorDoc) {
            return await this._reviewRepository.findByDoctorId(doctorDoc._id.toString());
        }
        return await this._reviewRepository.findByPatientId(userId);
    }

    async getReviewByAppointmentId(appointmentId: string): Promise<IReview | null> {
        return await this._reviewRepository.findByAppointmentId(appointmentId);
    }
}

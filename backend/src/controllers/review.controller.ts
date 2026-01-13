import { Request, Response, NextFunction } from "express";
import { IReviewService } from "../services/interfaces/IReviewService";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../errors/AppError";
import { HttpStatus, MESSAGES } from "../constants/constants";

export class ReviewController {
    constructor(private _reviewService: IReviewService) { }

    addReview = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const patientId = req.user?.userId;
            if (!patientId) throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

            const review = await this._reviewService.addReview({
                ...req.body,
                patientId
            });

            sendSuccess(res, review, "Review added successfully");
        } catch (error) {
            next(error);
        }
    };

    updateReview = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const patientId = req.user?.userId;
            const { reviewId } = req.params;
            if (!patientId) throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

            const review = await this._reviewService.updateReview(reviewId, patientId, req.body);
            sendSuccess(res, review, "Review updated successfully");
        } catch (error) {
            next(error);
        }
    };

    deleteReview = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const patientId = req.user?.userId;
            const { reviewId } = req.params;
            if (!patientId) throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

            await this._reviewService.deleteReview(reviewId, patientId);
            sendSuccess(res, null, "Review deleted successfully");
        } catch (error) {
            next(error);
        }
    };

    getDoctorReviews = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { doctorId } = req.params;
            const reviews = await this._reviewService.getDoctorReviews(doctorId);
            sendSuccess(res, reviews);
        } catch (error) {
            next(error);
        }
    };

    getDoctorStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { doctorId } = req.params;
            const stats = await this._reviewService.getDoctorStats(doctorId);
            sendSuccess(res, stats);
        } catch (error) {
            next(error);
        }
    };

    getAllReviews = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this._reviewService.getAllReviews(page, limit);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    };

    deleteReviewByAdmin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { reviewId } = req.params;
            await this._reviewService.deleteReviewById(reviewId);
            sendSuccess(res, null, "Review deleted successfully");
        } catch (error) {
            next(error);
        }
    };

    getReviewByPatientAndDoctor = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { doctorId } = req.params;
            const patientId = req.user?.userId;

            if (!patientId) throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

            const review = await this._reviewService.getReviewByPatientAndDoctorId(patientId, doctorId);
            sendSuccess(res, review);
        } catch (error) {
            next(error);
        }
    };
}

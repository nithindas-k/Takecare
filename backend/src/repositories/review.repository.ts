import ReviewModel, { IReview } from "../models/review.model";
import { BaseRepository } from "./base.repository";
import { IReviewRepository } from "./interfaces/IReview.repository";
import { Types } from "mongoose";

export class ReviewRepository extends BaseRepository<IReview> implements IReviewRepository {
    constructor() {
        super(ReviewModel);
    }

    async deleteById(id: string): Promise<IReview | null> {
        return await this.model.findByIdAndDelete(id).exec();
    }

    async findByDoctorId(doctorId: string): Promise<IReview[]> {
        return await this.model
            .find({ doctorId: new Types.ObjectId(doctorId) })
            .populate("patientId", "name profileImage")
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByPatientId(patientId: string): Promise<IReview[]> {
        return await this.model
            .find({ patientId: new Types.ObjectId(patientId) })
            .populate("doctorId")
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByAppointmentId(appointmentId: string): Promise<IReview | null> {
        return await this.model
            .findOne({ appointmentId: new Types.ObjectId(appointmentId) })
            .exec();
    }

    async findByPatientIdAndDoctorId(patientId: string, doctorId: string): Promise<IReview | null> {
        return await this.model
            .findOne({
                patientId: new Types.ObjectId(patientId),
                doctorId: new Types.ObjectId(doctorId)
            })
            .exec();
    }

    async getAverageRating(doctorId: string): Promise<{ averageRating: number; reviewCount: number }> {
        const stats = await this.model.aggregate([
            { $match: { doctorId: new Types.ObjectId(doctorId) } },
            {
                $group: {
                    _id: "$doctorId",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 },
                },
            },
        ]);

        if (stats.length === 0) {
            return { averageRating: 0, reviewCount: 0 };
        }

        return {
            averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
            reviewCount: stats[0].reviewCount,
        };
    }

    async getAllReviewsWithDetails(skip: number, limit: number): Promise<{ reviews: IReview[]; total: number }> {
        const reviews = await this.model
            .find()
            .populate("patientId", "name email profileImage")
            .populate({
                path: "doctorId",
                select: "specialty userId",
                populate: {
                    path: "userId",
                    select: "name profileImage"
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        const total = await this.model.countDocuments();

        return { reviews, total };
    }
}

import { IBaseRepository } from "./IBase.repository";
import { IReview } from "../../models/review.model";

export interface IReviewRepository extends IBaseRepository<IReview> {
    findByDoctorId(doctorId: string): Promise<IReview[]>;
    findByPatientId(patientId: string): Promise<IReview[]>;
    findByAppointmentId(appointmentId: string): Promise<IReview | null>;
    getAverageRating(doctorId: string): Promise<{ averageRating: number; reviewCount: number }>;
}

import { IPrescriptionRepository } from "./interfaces/IPrescription.repository";
import PrescriptionModel from "../models/prescription.model";
import { IPrescriptionDocument } from "../types/prescription.type";
import { BaseRepository } from "./base.repository";

export class PrescriptionRepository extends BaseRepository<IPrescriptionDocument> implements IPrescriptionRepository {
    constructor() {
        super(PrescriptionModel);
    }

    async findByAppointmentId(appointmentId: string): Promise<IPrescriptionDocument | null> {
        return await this.model.findOne({ appointmentId })
            .populate("patientId", "name email age gender profileImage phone")
            .populate({
                path: "doctorId",
                select: "specialty registrationNumber userId VideoFees ChatFees",
                populate: {
                    path: "userId",
                    select: "name email profileImage phone"
                }
            })
            .populate("appointmentId", "customId appointmentDate appointmentTime");
    }
}

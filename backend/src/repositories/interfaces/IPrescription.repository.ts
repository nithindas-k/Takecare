import { IBaseRepository } from "./IBase.repository";
import { IPrescriptionDocument } from "../../types/prescription.type";

export interface IPrescriptionRepository extends IBaseRepository<IPrescriptionDocument> {
    findByAppointmentId(appointmentId: string): Promise<IPrescriptionDocument | null>;
}

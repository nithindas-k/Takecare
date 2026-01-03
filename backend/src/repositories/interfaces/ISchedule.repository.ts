import { IDoctorScheduleDocument } from "../../types/schedule.type";
import { Types } from "mongoose";

export interface IScheduleRepository {
    create(scheduleData: Partial<IDoctorScheduleDocument>): Promise<IDoctorScheduleDocument>;
    findByDoctorId(doctorId: string | Types.ObjectId): Promise<IDoctorScheduleDocument | null>;
    updateByDoctorId(
        doctorId: string | Types.ObjectId,
        update: Partial<IDoctorScheduleDocument>
    ): Promise<IDoctorScheduleDocument | null>;
    addBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date,
        reason?: string,
        slots?: string[]
    ): Promise<IDoctorScheduleDocument | null>;
    removeBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date
    ): Promise<IDoctorScheduleDocument | null>;
    findById(id: string | Types.ObjectId): Promise<IDoctorScheduleDocument | null>;
    existsByDoctorId(doctorId: string | Types.ObjectId): Promise<boolean>;
    updateSlotBookedStatus(doctorId: string | Types.ObjectId, slotId: string, isBooked: boolean, appointmentDate?: Date, startTime?: string): Promise<boolean>;
}


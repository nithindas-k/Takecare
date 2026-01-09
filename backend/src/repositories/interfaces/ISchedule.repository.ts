import { IDoctorScheduleDocument } from "../../types/schedule.type";
import { Types } from "mongoose";

export interface IScheduleRepository {
    create(scheduleData: Partial<IDoctorScheduleDocument>, session?: any): Promise<IDoctorScheduleDocument>;
    findByDoctorId(doctorId: string | Types.ObjectId, session?: any): Promise<IDoctorScheduleDocument | null>;
    updateByDoctorId(
        doctorId: string | Types.ObjectId,
        update: Partial<IDoctorScheduleDocument>,
        session?: any
    ): Promise<IDoctorScheduleDocument | null>;
    addBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date,
        reason?: string,
        slots?: string[],
        session?: any
    ): Promise<IDoctorScheduleDocument | null>;
    removeBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date,
        session?: any
    ): Promise<IDoctorScheduleDocument | null>;
    findById(id: string | Types.ObjectId, session?: any): Promise<IDoctorScheduleDocument | null>;
    existsByDoctorId(doctorId: string | Types.ObjectId, session?: any): Promise<boolean>;
    updateSlotBookedStatus(doctorId: string | Types.ObjectId, slotId: string, isBooked: boolean, appointmentDate?: Date, startTime?: string, session?: any): Promise<boolean>;
}


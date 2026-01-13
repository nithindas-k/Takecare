import { IDoctorScheduleDocument } from "../../types/schedule.type";
import { Types, ClientSession } from "mongoose";

export interface IScheduleRepository {
    create(scheduleData: Partial<IDoctorScheduleDocument>, session?: ClientSession | undefined): Promise<IDoctorScheduleDocument>;
    findByDoctorId(doctorId: string | Types.ObjectId, session?: ClientSession | undefined): Promise<IDoctorScheduleDocument | null>;
    updateByDoctorId(
        doctorId: string | Types.ObjectId,
        update: Partial<IDoctorScheduleDocument>,
        session?: ClientSession | undefined
    ): Promise<IDoctorScheduleDocument | null>;
    addBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date,
        reason?: string,
        slots?: string[],
        session?: ClientSession | undefined
    ): Promise<IDoctorScheduleDocument | null>;
    removeBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date,
        session?: ClientSession | undefined
    ): Promise<IDoctorScheduleDocument | null>;
    findById(id: string | Types.ObjectId, session?: ClientSession | undefined): Promise<IDoctorScheduleDocument | null>;
    existsByDoctorId(doctorId: string | Types.ObjectId, session?: ClientSession | undefined): Promise<boolean>;
    updateSlotBookedStatus(doctorId: string | Types.ObjectId, slotId: string, isBooked: boolean, appointmentDate?: Date, startTime?: string, session?: ClientSession | undefined): Promise<boolean>;
}


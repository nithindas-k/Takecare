import { BaseRepository } from "./base.repository";
import { IScheduleRepository } from "./interfaces/ISchedule.repository";
import { IDoctorScheduleDocument } from "../types/schedule.type";
import DoctorScheduleModel from "../models/doctorSchedule.model";
import { Types } from "mongoose";

export class ScheduleRepository
    extends BaseRepository<IDoctorScheduleDocument>
    implements IScheduleRepository {
    constructor() {
        super(DoctorScheduleModel);
    }

    async findByDoctorId(
        doctorId: string | Types.ObjectId,
        session?: any
    ): Promise<IDoctorScheduleDocument | null> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        return await this.model.findOne({ doctorId: id }).session(session).exec();
    }

    async updateByDoctorId(
        doctorId: string | Types.ObjectId,
        update: Partial<IDoctorScheduleDocument>,
        session?: any
    ): Promise<IDoctorScheduleDocument | null> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        return await this.model
            .findOneAndUpdate({ doctorId: id }, update, { new: true, session })
            .exec();
    }

    async addBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date,
        reason?: string,
        slots?: string[],
        session?: any
    ): Promise<IDoctorScheduleDocument | null> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        const schedule = await this.model.findOne({ doctorId: id }).session(session).exec();

        if (!schedule) {
            return null;
        }

        const dateStr = date.toISOString().split("T")[0];

        schedule.blockedDates = schedule.blockedDates || [];

        const existingIndex = schedule.blockedDates.findIndex(
            (blocked) => blocked.date.toISOString().split("T")[0] === dateStr
        );

        if (existingIndex >= 0) {
            schedule.blockedDates[existingIndex].reason = reason || schedule.blockedDates[existingIndex].reason;
            schedule.blockedDates[existingIndex].slots = slots;
        } else {
            schedule.blockedDates.push({
                date,
                reason: reason || null,
                slots: slots
            });
        }

        return await schedule.save({ session });
    }

    async removeBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date,
        session?: any
    ): Promise<IDoctorScheduleDocument | null> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        const schedule = await this.model.findOne({ doctorId: id }).session(session).exec();

        if (!schedule) {
            return null;
        }

        const dateStr = date.toISOString().split("T")[0];
        schedule.blockedDates = schedule.blockedDates?.filter(
            (blocked) => blocked.date.toISOString().split("T")[0] !== dateStr
        ) || [];

        return await schedule.save({ session });
    }

    async updateSlotBookedStatus(
        doctorId: string | Types.ObjectId,
        slotId: string,
        isBooked: boolean,
        _appointmentDate?: Date,
        _startTime?: string,
        session?: any
    ): Promise<boolean> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;

      
        const query: any = { doctorId: id };

        if (isBooked) {
            
            query.weeklySchedule = {
                $elemMatch: {
                    slots: {
                        $elemMatch: {
                            customId: slotId,
                            booked: { $ne: true } 
                        }
                    }
                }
            };
        } else {
        
            query["weeklySchedule.slots.customId"] = slotId;
        }

        const result = await this.model.updateOne(
            query,
            { $set: { "weeklySchedule.$[day].slots.$[slot].booked": isBooked } },
            {
                arrayFilters: [
                    { "day.slots.customId": slotId },
                    { "slot.customId": slotId }
                ],
                session
            }
        );

      
        return result.modifiedCount > 0;
    }

    async existsByDoctorId(doctorId: string | Types.ObjectId, session?: any): Promise<boolean> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        const count = await this.model.countDocuments({ doctorId: id }).session(session);
        return count > 0;
    }
}


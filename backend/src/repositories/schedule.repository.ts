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
        doctorId: string | Types.ObjectId
    ): Promise<IDoctorScheduleDocument | null> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        return await this.model.findOne({ doctorId: id }).exec();
    }

    async updateByDoctorId(
        doctorId: string | Types.ObjectId,
        update: Partial<IDoctorScheduleDocument>
    ): Promise<IDoctorScheduleDocument | null> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        return await this.model
            .findOneAndUpdate({ doctorId: id }, update, { new: true })
            .exec();
    }

    async addBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date,
        reason?: string
    ): Promise<IDoctorScheduleDocument | null> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        const schedule = await this.model.findOne({ doctorId: id }).exec();

        if (!schedule) {
            return null;
        }


        const dateStr = date.toISOString().split("T")[0];
        const isAlreadyBlocked = schedule.blockedDates?.some(
            (blocked) => blocked.date.toISOString().split("T")[0] === dateStr
        );

        if (!isAlreadyBlocked) {
            schedule.blockedDates = schedule.blockedDates || [];
            schedule.blockedDates.push({
                date,
                reason: reason || null,
            });
            return await schedule.save();
        }

        return schedule;
    }

    async removeBlockedDate(
        doctorId: string | Types.ObjectId,
        date: Date
    ): Promise<IDoctorScheduleDocument | null> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        const schedule = await this.model.findOne({ doctorId: id }).exec();

        if (!schedule) {
            return null;
        }

        const dateStr = date.toISOString().split("T")[0];
        schedule.blockedDates = schedule.blockedDates?.filter(
            (blocked) => blocked.date.toISOString().split("T")[0] !== dateStr
        ) || [];

        return await schedule.save();
    }

    async updateSlotBookedStatus(
        doctorId: string | Types.ObjectId,
        slotId: string,
        isBooked: boolean,
        appointmentDate?: Date,
        startTime?: string
    ): Promise<boolean> {
        try {
            const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
            let result = await this.model.updateOne(
                { doctorId: id, "weeklySchedule.slots.customId": slotId },
                { $set: { "weeklySchedule.$[day].slots.$[slot].booked": isBooked } },
                {
                    arrayFilters: [
                        { "day.slots.customId": slotId },
                        { "slot.customId": slotId }
                    ]
                }
            );


            if (result.modifiedCount === 0 && appointmentDate && startTime) {
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const dayOfWeek = days[appointmentDate.getDay()];

                result = await this.model.updateOne(
                    {
                        doctorId: id,
                        "weeklySchedule": {
                            $elemMatch: {
                                day: dayOfWeek,
                                "slots.startTime": startTime
                            }
                        }
                    },
                    { $set: { "weeklySchedule.$[day].slots.$[slot].booked": isBooked } },
                    {
                        arrayFilters: [
                            { "day.day": dayOfWeek },
                            { "slot.startTime": startTime }
                        ]
                    }
                );
            }

            return result.modifiedCount > 0;
        } catch (error) {
            throw error;
        }
    }

    async existsByDoctorId(doctorId: string | Types.ObjectId): Promise<boolean> {
        const id = typeof doctorId === "string" ? new Types.ObjectId(doctorId) : doctorId;
        const count = await this.model.countDocuments({ doctorId: id });
        return count > 0;
    }
}


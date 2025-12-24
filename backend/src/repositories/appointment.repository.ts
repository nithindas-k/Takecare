import { IAppointmentRepository } from "./interfaces/IAppointmentRepository";
import { IAppointmentDocument } from "../types/appointment.type";
import AppointmentModel from "../models/appointment.model";
import { Types } from "mongoose";
import { BaseRepository } from "./base.repository";

export class AppointmentRepository extends BaseRepository<IAppointmentDocument> implements IAppointmentRepository {
    constructor() {
        super(AppointmentModel);
    }

    async create(appointmentData: any): Promise<IAppointmentDocument> {
        return await this.model.create(appointmentData);
    }

    async findById(appointmentId: string): Promise<IAppointmentDocument | null> {
        const appointment = await this.model.findOne({ customId: appointmentId });
        if (appointment) return appointment;

        if (!Types.ObjectId.isValid(appointmentId)) {
            return null;
        }
        return await super.findById(appointmentId);
    }




    async findByIdPopulated(appointmentId: string): Promise<any> {
        const appointment = await this.model
            .findOne({ customId: appointmentId })
            .populate({
                path: "patientId",
                select: "customId name email phone profileImage",
            })
            .populate({
                path: "doctorId",
                select: "customId userId specialty experienceYears VideoFees ChatFees",
                populate: {
                    path: "userId",
                    select: "customId name email phone profileImage",
                },
            })
            .lean();

        if (appointment) return appointment;

        if (!Types.ObjectId.isValid(appointmentId)) {
            return null;
        }

        return await this.model
            .findById(appointmentId)
            .populate({
                path: "patientId",
                select: "customId name email phone profileImage",
            })
            .populate({
                path: "doctorId",
                select: "customId userId specialty experienceYears VideoFees ChatFees",
                populate: {
                    path: "userId",
                    select: "customId name email phone profileImage",
                },
            })
            .lean();
    }

    async findByPatientId(
        patientId: string,
        status?: string,
        skip: number = 0,
        limit: number = 10
    ): Promise<{ appointments: any[]; total: number }> {
        const query: any = { patientId: new Types.ObjectId(patientId) };

        if (status) {
            query.status = status;
        }

        const [appointments, total] = await Promise.all([
            this.model
                .find(query)
                .select('customId patientId doctorId appointmentType appointmentDate appointmentTime slotId status consultationFees reason cancelledBy cancellationReason cancelledAt rejectionReason createdAt updatedAt')
                .populate({
                    path: "patientId",
                    select: "customId name email phone profileImage",
                })
                .populate({
                    path: "doctorId",
                    select: "customId userId specialty experienceYears VideoFees ChatFees",
                    populate: {
                        path: "userId",
                        select: "customId name email phone profileImage",
                    },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.model.countDocuments(query),
        ]);

        return { appointments, total };
    }

    async findByDoctorId(
        doctorId: string,
        status?: string,
        skip: number = 0,
        limit: number = 10
    ): Promise<{ appointments: any[]; total: number }> {
        const query: any = { doctorId: new Types.ObjectId(doctorId) };

        if (status) {
            query.status = status;
        }

        const [appointments, total] = await Promise.all([
            this.model
                .find(query)
                .select('customId patientId doctorId appointmentType appointmentDate appointmentTime slotId status consultationFees reason cancelledBy cancellationReason cancelledAt rejectionReason createdAt updatedAt')
                .populate({
                    path: "patientId",
                    select: "customId name email phone profileImage",
                })
                .populate({
                    path: "doctorId",
                    select: "customId userId specialty experienceYears VideoFees ChatFees",
                    populate: {
                        path: "userId",
                        select: "customId name email phone profileImage",
                    },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.model.countDocuments(query),
        ]);

        return { appointments, total };
    }

    async findAll(
        filters: {
            status?: string;
            search?: string;
            startDate?: Date;
            endDate?: Date;
            doctorId?: string;
            patientId?: string;
        },
        skip: number = 0,
        limit: number = 10
    ): Promise<{ appointments: any[]; total: number }> {
        const query: any = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.doctorId) {
            query.doctorId = new Types.ObjectId(filters.doctorId);
        }

        if (filters.patientId) {
            query.patientId = new Types.ObjectId(filters.patientId);
        }

        if (filters.startDate || filters.endDate) {
            query.appointmentDate = {};
            if (filters.startDate) {
                query.appointmentDate.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.appointmentDate.$lte = filters.endDate;
            }
        }

        if (filters.search) {
            const searchRegex = new RegExp(filters.search, "i");
            query.$or = [
                { customId: searchRegex },
                { status: searchRegex },
                { appointmentTime: searchRegex }
            ];
        }

        const [appointments, total] = await Promise.all([
            this.model
                .find(query)
                .populate({
                    path: "patientId",
                    select: "customId name email phone profileImage gender dob",
                })
                .populate({
                    path: "doctorId",
                    select: "userId specialty experienceYears VideoFees ChatFees",
                    populate: {
                        path: "userId",
                        select: "name email phone profileImage",
                    },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.model.countDocuments(query),
        ]);

        return { appointments, total };
    }

    async updateById(
        appointmentId: string,
        updateData: any
    ): Promise<IAppointmentDocument | null> {
        const byCustomId = await this.model.findOneAndUpdate(
            { customId: appointmentId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (byCustomId) return byCustomId;

        if (!Types.ObjectId.isValid(appointmentId)) {
            return null;
        }

        return await super.updateById(appointmentId, updateData);
    }


    async deleteById(appointmentId: string): Promise<any> {
        
        if (!Types.ObjectId.isValid(appointmentId)) {
            return null;
        }
        return await this.model.findByIdAndDelete(appointmentId).exec();
    }

    async countByStatus(status: string): Promise<number> {
        return await this.model.countDocuments({ status });
    }

    async countByDoctorId(doctorId: string, status?: string): Promise<number> {
        const query: any = { doctorId: new Types.ObjectId(doctorId) };
        if (status) query.status = status;
        return await this.model.countDocuments(query);
    }

    async countByPatientId(patientId: string, status?: string): Promise<number> {
        const query: any = { patientId: new Types.ObjectId(patientId) };
        if (status) query.status = status;
        return await this.model.countDocuments(query);
    }


}


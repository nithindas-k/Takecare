import { IAppointmentRepository } from "./interfaces/IAppointmentRepository";
import { IAppointmentDocument } from "../types/appointment.type";
import AppointmentModel from "../models/appointment.model";
import { Types } from "mongoose";

export class AppointmentRepository implements IAppointmentRepository {
    private model = AppointmentModel;

    async create(appointmentData: any): Promise<IAppointmentDocument> {
        const appointment = await this.model.create(appointmentData);
        return appointment;
    }

    async findById(appointmentId: string): Promise<IAppointmentDocument | null> {

        const appointment = await this.model.findOne({ customId: appointmentId });
        if (appointment) return appointment;

        if (!Types.ObjectId.isValid(appointmentId)) {
            return null;
        }
        return await this.model.findById(appointmentId);
    }


    async validate(Id: Types.ObjectId): Promise<any> {
        const data = await this.model.aggregate([{ $group: { _id: Id, count: { $sum: 1 } } }])

        return data.length > 0 ? data[0].count : 0
    }

    async findByIdPopulated(appointmentId: string): Promise<any> {

        let appointment = await this.model
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
        status?: string,
        skip: number = 0,
        limit: number = 10
    ): Promise<{ appointments: any[]; total: number }> {
        const query: any = {};

        if (status) {
            query.status = status;
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

        return await this.model.findByIdAndUpdate(
            appointmentId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }

    async deleteById(appointmentId: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(appointmentId)) {
            return false;
        }

        const result = await this.model.findByIdAndDelete(appointmentId);
        return result !== null;
    }

    async countByStatus(status: string): Promise<number> {
        return await this.model.countDocuments({ status });
    }

    async countByDoctorId(doctorId: string, status?: string): Promise<number> {
        const query: any = { doctorId: new Types.ObjectId(doctorId) };

        if (status) {
            query.status = status;
        }

        return await this.model.countDocuments(query);
    }

    async countByPatientId(patientId: string, status?: string): Promise<number> {
        const query: any = { patientId: new Types.ObjectId(patientId) };

        if (status) {
            query.status = status;
        }

        return await this.model.countDocuments(query);
    }
}

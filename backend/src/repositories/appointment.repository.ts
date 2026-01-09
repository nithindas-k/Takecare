import { IAppointmentRepository } from "./interfaces/IAppointmentRepository";
import { IAppointmentDocument } from "../types/appointment.type";
import AppointmentModel from "../models/appointment.model";
import { Types } from "mongoose";
import { BaseRepository } from "./base.repository";
import { DashboardStats, DoctorDashboardStats } from "../types/appointment.type";

export class AppointmentRepository extends BaseRepository<IAppointmentDocument> implements IAppointmentRepository {
    constructor() {
        super(AppointmentModel);
    }

    async create(appointmentData: any, session?: any): Promise<IAppointmentDocument> {
        // When using sessions with .create(), it must be an array
        const created = await this.model.create([appointmentData], { session });
        return created[0];
    }

    async findById(appointmentId: string, session?: any): Promise<IAppointmentDocument | null> {
        const appointment = await this.model.findOne({ customId: appointmentId }).session(session);
        if (appointment) return appointment;

        if (!Types.ObjectId.isValid(appointmentId)) {
            return null;
        }
        return await super.findById(appointmentId, session);
    }




    async findByIdPopulated(appointmentId: string, session?: any): Promise<any> {
        const appointment = await this.model
            .findOne({ customId: appointmentId })
            .session(session)
            .populate({
                path: "patientId",
                select: "customId name email phone profileImage userId",
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
            .session(session)
            .populate({
                path: "patientId",
                select: "customId name email phone profileImage userId",
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
        updateData: any,
        session?: any
    ): Promise<IAppointmentDocument | null> {
        console.log(`[AppointmentRepository] updateById called for ${appointmentId}`, updateData);

        const byCustomId = await this.model.findOneAndUpdate(
            { customId: appointmentId },
            { $set: updateData },
            { new: true, runValidators: true, session }
        );

        if (byCustomId) {
            console.log(`[AppointmentRepository] Updated by customId: ${appointmentId}`);
            return byCustomId;
        }

        if (!Types.ObjectId.isValid(appointmentId)) {
            console.warn(`[AppointmentRepository] Invalid ObjectId and not found by customId: ${appointmentId}`);
            return null;
        }

        console.log(`[AppointmentRepository] Updating by _id: ${appointmentId}`);
        // Explicitly use $set to ensure partial update
        const result = await this.model.findByIdAndUpdate(
            appointmentId,
            { $set: updateData },
            { new: true, runValidators: true, session }
        ).exec();

        console.log(`[AppointmentRepository] Update by _id result: ${result ? 'Success' : 'Failed'}`);
        return result;
    }


    async deleteById(appointmentId: string, session?: any): Promise<any> {

        if (!Types.ObjectId.isValid(appointmentId)) {
            return null;
        }
        return await this.model.findByIdAndDelete(appointmentId).session(session).exec();
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



    async getAdminDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {
        // Build date filter query
        let dateQuery: any = {};
        if (startDate || endDate) {
            dateQuery.createdAt = {};
            if (startDate) dateQuery.createdAt.$gte = startDate;
            if (endDate) dateQuery.createdAt.$lte = endDate;
        }

        // Apply date filter to total appointments count
        const totalAppointments = await this.model.countDocuments(dateQuery);

        // Apply date filter to revenue and status distribution
        const pipeline: any[] = [];
        if (Object.keys(dateQuery).length > 0) {
            pipeline.push({ $match: dateQuery });
        }

        pipeline.push({
            $group: {
                _id: null,
                totalRevenue: { $sum: "$adminCommission" },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            }
        });

        const [revenueAndStatus] = await this.model.aggregate(pipeline);

        // Revenue Graph
        // Default to last 7 days if no range provided
        let matchDateQuery: any = {};

        if (startDate || endDate) {
            matchDateQuery.createdAt = {};
            if (startDate) matchDateQuery.createdAt.$gte = startDate;
            if (endDate) matchDateQuery.createdAt.$lte = endDate;
        } else {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            matchDateQuery.createdAt = { $gte: sevenDaysAgo };
        }


        const revenueGraph = await this.model.aggregate([
            { $match: { ...matchDateQuery, paymentStatus: 'paid' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: "$adminCommission" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top Doctors (by Revenue)
        const topDoctors = await this.model.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: "$doctorId",
                    revenue: { $sum: "$adminCommission" },
                    appointments: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "doctors",
                    localField: "_id",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            { $unwind: "$doctor" },
            {
                $lookup: {
                    from: "users",
                    localField: "doctor.userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    doctorId: "$_id",
                    name: "$user.name",
                    revenue: 1,
                    appointments: 1
                }
            }
        ]);

        return {
            totalAppointments,
            totalRevenue: revenueAndStatus?.totalRevenue || 0,
            statusDistribution: {
                completed: revenueAndStatus?.completed || 0,
                cancelled: revenueAndStatus?.cancelled || 0,
                pending: revenueAndStatus?.pending || 0
            },
            revenueGraph: revenueGraph.map(g => ({ date: g._id, amount: g.amount })),
            topDoctors
        };
    }

    async getDoctorDashboardStats(doctorId: string, startDate?: Date, endDate?: Date): Promise<DoctorDashboardStats> {
        const docId = new Types.ObjectId(doctorId);
        const totalAppointments = await this.model.countDocuments({ doctorId: docId });

        const [earningsStats] = await this.model.aggregate([
            { $match: { doctorId: docId, status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$doctorEarnings" },
                    uniquePatients: { $addToSet: "$patientId" }
                }
            }
        ]);

        // Count unique patients manually from the set
        const totalPatients = earningsStats?.uniquePatients?.length || 0;

        // Appointments Today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const appointmentsToday = await this.model.countDocuments({
            doctorId: docId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'confirmed'] }
        });

        // Revenue Graph
        let matchDateQuery: any = {};

        if (startDate || endDate) {
            matchDateQuery.createdAt = {};
            if (startDate) matchDateQuery.createdAt.$gte = startDate;
            if (endDate) matchDateQuery.createdAt.$lte = endDate;
        } else {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            matchDateQuery.createdAt = { $gte: sevenDaysAgo };
        }

        const revenueGraph = await this.model.aggregate([
            { $match: { doctorId: docId, ...matchDateQuery, status: 'completed' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: "$doctorEarnings" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Next Upcoming Appointment
        const nextAppointment = await this.model.findOne({
            doctorId: docId,
            appointmentDate: { $gte: new Date() },
            status: { $in: ['pending', 'confirmed'] }
        }).sort({ appointmentDate: 1 }).populate({
            path: 'patientId',
            select: 'name profileImage'
        });

        return {
            totalAppointments,
            totalPatients,
            totalEarnings: earningsStats?.totalEarnings || 0,
            appointmentsToday,
            revenueGraph: revenueGraph.map(g => ({ date: g._id, amount: g.amount })),
            nextAppointment
        };
    }
}


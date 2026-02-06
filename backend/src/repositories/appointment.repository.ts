import { IAppointmentRepository } from "./interfaces/IAppointmentRepository";
import { IAppointmentDocument, IAppointmentPopulated } from "../types/appointment.type";
import AppointmentModel from "../models/appointment.model";
import { Types, ClientSession, PipelineStage } from "mongoose";
import { BaseRepository } from "./base.repository";
import { DashboardStats, DoctorDashboardStats } from "../types/appointment.type";
import { APPOINTMENT_STATUS } from "../constants/constants";

type AppointmentListQuery = {
    status?: string;
    doctorId?: Types.ObjectId;
    patientId?: Types.ObjectId;
    appointmentDate?: {
        $gte?: Date;
        $lte?: Date;
    };
    $or?: {
        customId?: RegExp;
        status?: RegExp;
        appointmentTime?: RegExp;
    }[];
};

export class AppointmentRepository extends BaseRepository<IAppointmentDocument> implements IAppointmentRepository {
    constructor() {
        super(AppointmentModel);
    }

    async create(appointmentData: Partial<IAppointmentDocument>, session?: ClientSession | undefined): Promise<IAppointmentDocument> {

        const created = await this.model.create([appointmentData], { session: session || undefined });
        return created[0];
    }

    async findById(appointmentId: string, session?: ClientSession | undefined): Promise<IAppointmentDocument | null> {
        const query = Types.ObjectId.isValid(appointmentId)
            ? { _id: new Types.ObjectId(appointmentId) }
            : { customId: appointmentId };

        console.log(`[AppointmentRepository] Searching for appointment with query:`, query);
        const result = await this.model.findOne(query).session(session || null).exec();
        console.log(`[AppointmentRepository] Search result: ${result ? 'Found' : 'NOT FOUND'}`);
        return result;
    }




    async findByIdPopulated(appointmentId: string, session?: ClientSession | undefined): Promise<IAppointmentPopulated | null> {
        let query: Record<string, unknown>;
        if (Types.ObjectId.isValid(appointmentId)) {
            query = { _id: appointmentId };
        } else {
            query = { customId: appointmentId };
        }

        const doc = await this.model
            .findOne(query)
            .session(session || null)
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
            .lean<IAppointmentPopulated>();

        return doc;
    }

    async findByPatientId(
        patientId: string,
        status?: string,
        skip: number = 0,
        limit: number = 10,
        _session?: ClientSession | undefined
    ): Promise<{ appointments: IAppointmentPopulated[]; total: number }> {
        const query: Record<string, unknown> = { patientId: new Types.ObjectId(patientId) };

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
                .lean<IAppointmentPopulated[]>(),
            this.model.countDocuments(query),
        ]);

        return { appointments, total };
    }

    async findByDoctorId(
        doctorId: string,
        status?: string,
        skip: number = 0,
        limit: number = 10,
        _session?: ClientSession | undefined
    ): Promise<{ appointments: IAppointmentPopulated[]; total: number }> {
        const query: Record<string, unknown> = { doctorId: new Types.ObjectId(doctorId) };

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
                .lean<IAppointmentPopulated[]>(),
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
    ): Promise<{ appointments: IAppointmentPopulated[]; total: number }> {
        const query: AppointmentListQuery = {};

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
                .lean<IAppointmentPopulated[]>(),
            this.model.countDocuments(query),
        ]);

        return { appointments, total };
    }

    async updateById(
        appointmentId: string,
        updateData: Partial<IAppointmentDocument>,
        session?: ClientSession | undefined
    ): Promise<IAppointmentDocument | null> {
        console.log(`[AppointmentRepository] updateById called for ${appointmentId}`, updateData);

        if (!Types.ObjectId.isValid(appointmentId)) {
            console.warn(`[AppointmentRepository] Invalid ObjectId: ${appointmentId}`);
            return null;
        }

        console.log(`[AppointmentRepository] Updating by _id: ${appointmentId}`);
        const update = Object.keys(updateData).some(key => key.startsWith('$'))
            ? updateData
            : { $set: updateData };

        const result = await this.model.findByIdAndUpdate(
            appointmentId,
            update,
            { new: true, runValidators: true, session: session || undefined }
        ).exec();

        console.log(`[AppointmentRepository] Update by _id result: ${result ? 'Success' : 'Failed'}`);
        return result;
    }


    async deleteById(appointmentId: string, session?: ClientSession | undefined): Promise<IAppointmentDocument | null> {

        if (!Types.ObjectId.isValid(appointmentId)) {
            return null;
        }
        return await this.model.findByIdAndDelete(appointmentId).session(session || null).exec();
    }

    async countByStatus(status: string): Promise<number> {
        return await this.model.countDocuments({ status });
    }

    async countByDoctorId(doctorId: string, status?: string): Promise<number> {
        const query: Record<string, unknown> = { doctorId: new Types.ObjectId(doctorId) };
        if (status) query.status = status;
        return await this.model.countDocuments(query);
    }

    async countByPatientId(patientId: string, status?: string): Promise<number> {
        const query: Record<string, unknown> = { patientId: new Types.ObjectId(patientId) };
        if (status) query.status = status;
        return await this.model.countDocuments(query);
    }



    async getAdminDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {

        const dateQuery: { createdAt?: { $gte?: Date; $lte?: Date } } = {};
        if (startDate || endDate) {
            dateQuery.createdAt = {};
            if (startDate) dateQuery.createdAt.$gte = startDate;
            if (endDate) dateQuery.createdAt.$lte = endDate;
        }

        const totalAppointments = await this.model.countDocuments(dateQuery);

        const pipeline: PipelineStage[] = [];
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
                confirmed: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
            }
        });

        const [revenueAndStatus] = await this.model.aggregate(pipeline);


        const matchDateQuery: { createdAt?: { $gte?: Date; $lte?: Date } } = {};

        if (startDate || endDate) {
            matchDateQuery.createdAt = {};
            if (startDate) matchDateQuery.createdAt.$gte = startDate;
            if (endDate) matchDateQuery.createdAt.$lte = endDate;
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
                    profileImage: "$user.profileImage",
                    specialty: "$doctor.specialty",
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
                pending: revenueAndStatus?.pending || 0,
                confirmed: revenueAndStatus?.confirmed || 0
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


        const totalPatients = earningsStats?.uniquePatients?.length || 0;

        //Appointments Today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const appointmentsToday = await this.model.countDocuments({
            doctorId: docId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'confirmed'] }
        });

        const matchDateQuery: { appointmentDate?: { $gte?: Date; $lte?: Date } } = {};

        if (startDate || endDate) {
            matchDateQuery.appointmentDate = {};
            if (startDate) matchDateQuery.appointmentDate.$gte = startDate;
            if (endDate) matchDateQuery.appointmentDate.$lte = endDate;
        }

        const revenueGraph = await this.model.aggregate([
            { $match: { doctorId: docId, ...matchDateQuery, status: 'completed' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } },
                    amount: { $sum: "$doctorEarnings" }
                }
            },
            { $sort: { _id: 1 } }
        ]);


        const nextAppointment = await this.model.findOne({
            doctorId: docId,
            appointmentDate: { $gte: startOfDay },
            status: { $in: ['pending', 'confirmed'] }
        })
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .populate({
                path: 'patientId',
                select: 'name profileImage'
            })
            .lean<IAppointmentDocument & { patientId: { name: string; profileImage?: string } } | null>();

        return {
            totalAppointments,
            totalPatients,
            totalEarnings: earningsStats?.totalEarnings || 0,
            appointmentsToday,
            revenueGraph: revenueGraph.map(g => ({ date: g._id, amount: g.amount })),
            nextAppointment
        };
    }
    async getStatusCounts(
        filter: { doctorId?: string; patientId?: string }
    ): Promise<{ upcoming: number; completed: number; cancelled: number }> {
        const match: Record<string, unknown> = {};
        if (filter.doctorId) match.doctorId = new Types.ObjectId(filter.doctorId);
        if (filter.patientId) match.patientId = new Types.ObjectId(filter.patientId);

        const counts = await this.model.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    upcoming: {
                        $sum: {
                            $cond: [{
                                $in: ["$status", [
                                    APPOINTMENT_STATUS.PENDING,
                                    APPOINTMENT_STATUS.CONFIRMED,
                                    APPOINTMENT_STATUS.RESCHEDULE_REQUESTED
                                ]]
                            }, 1, 0]
                        }
                    },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ["$status", APPOINTMENT_STATUS.COMPLETED] }, 1, 0]
                        }
                    },
                    cancelled: {
                        $sum: {
                            $cond: [{
                                $in: ["$status", [
                                    APPOINTMENT_STATUS.CANCELLED,
                                    APPOINTMENT_STATUS.REJECTED
                                ]]
                            }, 1, 0]
                        }
                    }
                }
            }
        ]);

        return counts[0] || { upcoming: 0, completed: 0, cancelled: 0 };
    }

    async getReportData(startDate?: Date, endDate?: Date): Promise<{
        summary: {
            totalVolume: number;
            totalRefunds: number;
            doctorPayout: number;
            adminEarnings: number;
        };
        appointments: IAppointmentPopulated[];
    }> {
        const dateQuery: { createdAt?: { $gte?: Date; $lte?: Date } } = {};
        if (startDate || endDate) {
            dateQuery.createdAt = {};
            if (startDate) dateQuery.createdAt.$gte = startDate;
            if (endDate) dateQuery.createdAt.$lte = endDate;
        }

        const pipeline: PipelineStage[] = [];
        if (Object.keys(dateQuery).length > 0) {
            pipeline.push({ $match: dateQuery });
        }

        pipeline.push({
            $group: {
                _id: null,
                totalVolume: {
                    $sum: {
                        $cond: [{ $in: ["$paymentStatus", ["paid", "refunded"]] }, "$consultationFees", 0]
                    }
                },
                totalRefunds: {
                    $sum: {
                        $cond: [{ $eq: ["$paymentStatus", "refunded"] }, "$consultationFees", 0]
                    }
                },
                doctorPayout: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "completed"] }, "$doctorEarnings", 0]
                    }
                },
                adminEarnings: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "completed"] }, "$adminCommission", 0]
                    }
                }
            }
        });

        const [summaryResult] = await this.model.aggregate(pipeline);

        const appointments = await this.model.find(dateQuery)
            .populate({
                path: "patientId",
                select: "name email phone profileImage"
            })
            .populate({
                path: "doctorId",
                select: "userId specialty",
                populate: {
                    path: "userId",
                    select: "name email"
                }
            })
            .sort({ createdAt: -1 })
            .lean<IAppointmentPopulated[]>();

        return {
            summary: {
                totalVolume: summaryResult?.totalVolume || 0,
                totalRefunds: summaryResult?.totalRefunds || 0,
                doctorPayout: summaryResult?.doctorPayout || 0,
                adminEarnings: summaryResult?.adminEarnings || 0
            },
            appointments
        };
    }
}


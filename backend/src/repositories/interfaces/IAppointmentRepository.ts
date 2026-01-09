import { Types } from "mongoose";
import { IAppointmentDocument, DashboardStats, DoctorDashboardStats } from "../../types/appointment.type";
import { IBaseRepository } from "./IBase.repository";

export interface IAppointmentRepository extends IBaseRepository<IAppointmentDocument> {
    create(appointmentData: any, session?: any): Promise<IAppointmentDocument>;
    findById(appointmentId: string, session?: any): Promise<IAppointmentDocument | null>;
    findByIdPopulated(appointmentId: string, session?: any): Promise<any>;
    findByPatientId(
        patientId: string,
        status?: string,
        skip?: number,
        limit?: number,
        session?: any
    ): Promise<{ appointments: any[]; total: number }>;
    findByDoctorId(
        doctorId: string,
        status?: string,
        skip?: number,
        limit?: number,
        session?: any
    ): Promise<{ appointments: any[]; total: number }>;
    findAll(
        filters: {
            status?: string;
            search?: string;
            startDate?: Date;
            endDate?: Date;
            doctorId?: string;
            patientId?: string;
        },
        skip?: number,
        limit?: number,
        session?: any
    ): Promise<{ appointments: any[]; total: number }>;
    updateById(appointmentId: string, updateData: any, session?: any): Promise<IAppointmentDocument | null>;
    deleteById(appointmentId: string, session?: any): Promise<any>;
    countByStatus(status: string): Promise<number>;
    countByDoctorId(doctorId: string, status?: string): Promise<number>;
    countByPatientId(patientId: string, status?: string): Promise<number>;
    findOne(filter: Record<string, any>, session?: any): Promise<IAppointmentDocument | null>;
    getAdminDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats>;
    getDoctorDashboardStats(doctorId: string, startDate?: Date, endDate?: Date): Promise<DoctorDashboardStats>;
}

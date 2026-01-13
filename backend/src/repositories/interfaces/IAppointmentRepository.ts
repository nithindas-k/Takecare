import { Types, ClientSession } from "mongoose";
import { IAppointmentDocument, DashboardStats, DoctorDashboardStats, IAppointmentPopulated } from "../../types/appointment.type";
import { IBaseRepository } from "./IBase.repository";

export interface IAppointmentRepository extends IBaseRepository<IAppointmentDocument> {
    create(appointmentData: Partial<IAppointmentDocument>, session?: ClientSession | undefined): Promise<IAppointmentDocument>;
    findById(appointmentId: string, session?: ClientSession | undefined): Promise<IAppointmentDocument | null>;
    findByIdPopulated(appointmentId: string, session?: ClientSession | undefined): Promise<IAppointmentPopulated | null>;
    findByPatientId(
        patientId: string,
        status?: string,
        skip?: number,
        limit?: number,
        session?: ClientSession | undefined
    ): Promise<{ appointments: IAppointmentPopulated[]; total: number }>;
    findByDoctorId(
        doctorId: string,
        status?: string,
        skip?: number,
        limit?: number,
        session?: ClientSession | undefined
    ): Promise<{ appointments: IAppointmentPopulated[]; total: number }>;
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
        session?: ClientSession | undefined
    ): Promise<{ appointments: IAppointmentPopulated[]; total: number }>;
    updateById(appointmentId: string, updateData: Partial<IAppointmentDocument>, session?: ClientSession | undefined): Promise<IAppointmentDocument | null>;
    deleteById(appointmentId: string, session?: ClientSession | undefined): Promise<IAppointmentDocument | null>;
    countByStatus(status: string): Promise<number>;
    countByDoctorId(doctorId: string, status?: string): Promise<number>;
    countByPatientId(patientId: string, status?: string): Promise<number>;
    findOne(filter: Record<string, unknown>, session?: ClientSession | undefined): Promise<IAppointmentDocument | null>;
    getAdminDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats>;
    getDoctorDashboardStats(doctorId: string, startDate?: Date, endDate?: Date): Promise<DoctorDashboardStats>;
}

import { Types } from "mongoose";
import { IAppointmentDocument } from "../../types/appointment.type";

export interface IAppointmentRepository {
    create(appointmentData: any): Promise<IAppointmentDocument>;
    findById(appointmentId: string): Promise<IAppointmentDocument | null>;
    findByIdPopulated(appointmentId: string): Promise<any>;
    findByPatientId(
        patientId: string,
        status?: string,
        skip?: number,
        limit?: number
    ): Promise<{ appointments: any[]; total: number }>;
    findByDoctorId(
        doctorId: string,
        status?: string,
        skip?: number,
        limit?: number
    ): Promise<{ appointments: any[]; total: number }>;
    findAll(
        status?: string,
        skip?: number,
        limit?: number
    ): Promise<{ appointments: any[]; total: number }>;
    updateById(appointmentId: string, updateData: any): Promise<IAppointmentDocument | null>;
    deleteById(appointmentId: string): Promise<boolean>;
    countByStatus(status: string): Promise<number>;
    countByDoctorId(doctorId: string, status?: string): Promise<number>;
    countByPatientId(patientId: string, status?: string): Promise<number>;
    validate(Id: Types.ObjectId): Promise<any>
}

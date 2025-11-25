import { Types } from "mongoose";
import { IBaseRepository } from "./IBase.repository";
import { IDoctorDocument } from "../../types/doctor.type";


export interface IDoctorRepository extends IBaseRepository<IDoctorDocument> {

  create(data: Partial<IDoctorDocument> & { userId: string | Types.ObjectId }): Promise<IDoctorDocument>;

  findByUserId(userId: string): Promise<IDoctorDocument | null>;
  findAllActive(): Promise<IDoctorDocument[]>;
  findPendingVerifications(): Promise<IDoctorDocument[]>;

  getPendingDoctorRequests(): Promise<any[]>;
  getDoctorRequestDetailById(doctorId: string): Promise<any | null>;
  updateById(id: string | Types.ObjectId, update: Partial<IDoctorDocument>): Promise<IDoctorDocument | null>;
  getAllDoctors(skip: number, limit: number): Promise<{ doctors: IDoctorDocument[]; total: number }>;
}

import { Types } from "mongoose";
import { IBaseRepository } from "./IBase.repository";
import { IDoctorDocument, DoctorRequestItem, DoctorRequestDetail } from "../../types/doctor.type";
import { VerificationStatus } from "../../dtos/doctor.dtos/doctor.dto";

export interface IDoctorRepository extends IBaseRepository<IDoctorDocument> {

  create(data: Partial<IDoctorDocument> & { userId: string | Types.ObjectId }): Promise<IDoctorDocument>;

  findByUserId(userId: string): Promise<IDoctorDocument | null>;
  findAllActive(): Promise<IDoctorDocument[]>;
  findPendingVerifications(): Promise<IDoctorDocument[]>;

  getPendingDoctorRequests(): Promise<DoctorRequestItem[]>;
  getAllDoctorRequests(): Promise<DoctorRequestItem[]>;
  getDoctorRequestDetailById(doctorId: string): Promise<DoctorRequestDetail | null>;
  updateById(id: string | Types.ObjectId, update: Partial<IDoctorDocument>): Promise<IDoctorDocument | null>;
  getAllDoctors(skip: number, limit: number, filter?: { specialty?: string; search?: string; verificationStatus?: string; isActive?: boolean; sort?: any; minExperience?: number; minRating?: number }): Promise<{ doctors: IDoctorDocument[]; total: number }>;
  findRelatedDoctors(specialty: string, currentDoctorId: string, limit: number): Promise<IDoctorDocument[]>;

}

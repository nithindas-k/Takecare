import DoctorModel from "../models/doctor.model";
import { IDoctorDocument } from "../types/doctor.type";
import { BaseRepository } from "./base.repository";
import { Types } from "mongoose";
import { IDoctorRepository } from "./interfaces/IDoctor.repository";

export class DoctorRepository extends BaseRepository<IDoctorDocument> implements IDoctorRepository {
  constructor() {
    super(DoctorModel);
  }

  async create(data: Partial<IDoctorDocument>): Promise<IDoctorDocument> {
    const userId = typeof data.userId === "string"
      ? new Types.ObjectId(data.userId)
      : data.userId;
    return await DoctorModel.create({ ...data, userId });
  }

  async findByUserId(userId: string): Promise<IDoctorDocument | null> {
    return await this.model.findOne({ userId }).exec();
  }

  async findAllActive(): Promise<IDoctorDocument[]> {
    return await this.model.find({ isActive: true }).exec();
  }

  async getAllDoctors(skip: number, limit: number): Promise<{ doctors: IDoctorDocument[]; total: number }> {
    const query = { verificationStatus: "approved" };
    const doctors = await this.model
      .find(query)
      .populate("userId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await this.model.countDocuments(query);

    return { doctors, total };
  }

  async findPendingVerifications(): Promise<IDoctorDocument[]> {
    return await this.model.find({ verificationStatus: "pending" }).exec();
  }

  async getPendingDoctorRequests() {
    return await this.model
      .find({ verificationStatus: "pending" })
      .populate("userId")
      .lean();
  }

  async getDoctorRequestDetailById(doctorId: string) {
    return await this.model
      .findById(doctorId)
      .populate("userId")
      .lean();
  }
}

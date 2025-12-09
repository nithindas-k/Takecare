import DoctorModel from "../models/doctor.model";
import { IDoctorDocument, DoctorRequestItem, DoctorRequestDetail } from "../types/doctor.type";
import { BaseRepository } from "./base.repository";
import { Types } from "mongoose";
import { IDoctorRepository } from "./interfaces/IDoctor.repository";
import { IUserDocument } from "../types/user.type";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";

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
    const query = { verificationStatus: VerificationStatus.Approved };
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
    return await this.model.find({ verificationStatus: VerificationStatus.Pending }).exec();
  }

  async getPendingDoctorRequests(): Promise<DoctorRequestItem[]> {
    const docs = await this.model
      .find({ verificationStatus: VerificationStatus.Pending })
      .populate("userId")
      .lean();

    return docs.map(doc => this.mapDoctorRequestItem(doc));
  }

  async getAllDoctorRequests(): Promise<DoctorRequestItem[]> {
    const docs = await this.model
      .find({ verificationStatus: VerificationStatus.Pending })
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean();

    return docs.map(doc => this.mapDoctorRequestItem(doc));
  }

  async getDoctorRequestDetailById(doctorId: string): Promise<DoctorRequestDetail | null> {
    const doc = await this.model
      .findById(doctorId)
      .populate("userId")
      .lean();

    if (!doc) return null;

    const user = doc.userId as unknown as IUserDocument;
    return {
      _id: doc._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      specialty: doc.specialty,
      experienceYears: doc.experienceYears,
      verificationStatus: doc.verificationStatus,
      rejectionReason: doc.rejectionReason,
      createdAt: doc.createdAt,
      profileImage: user.profileImage,
      qualifications: doc.qualifications,
      VideoFees: doc.VideoFees,
      ChatFees: doc.ChatFees,
      languages: doc.languages,
      verificationDocuments: doc.verificationDocuments,
      isActive: doc.isActive,
      updatedAt: doc.updatedAt,
      gender: user.gender,
      dob: user.dob,
    };
  }

  async updateById(id: string | Types.ObjectId, update: Partial<IDoctorDocument>): Promise<IDoctorDocument | null> {
    console.log(`DoctorRepository.updateById called for ${id} with update:`, update);
    const result = await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    console.log("DoctorRepository.updateById result:", result);
    return result;
  }

  /**
   * Private helper method to map doctor document to DoctorRequestItem
   * Eliminates duplicate mapping logic
   */
  private mapDoctorRequestItem(doc: any): DoctorRequestItem {
    const user = doc.userId as unknown as IUserDocument;
    return {
      _id: doc._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      specialty: doc.specialty,
      experienceYears: doc.experienceYears,
      verificationStatus: doc.verificationStatus,
      rejectionReason: doc.rejectionReason,
      createdAt: doc.createdAt,
      profileImage: user.profileImage,
    };
  }
}

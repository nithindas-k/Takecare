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
    if (!userId || typeof userId !== 'string') {
      return null;
    }
    try {
      const userIdObjectId = new Types.ObjectId(userId);
      return await this.model.findOne({ userId: userIdObjectId }).exec();
    } catch (error) {
      return null;
    }
  }
  async findAllActive(): Promise<IDoctorDocument[]> {
    return await this.model.find({ isActive: true }).exec();
  }



  async getAllDoctors(skip: number, limit: number, filter?: { specialty?: string; search?: string; verificationStatus?: string; isActive?: boolean; sort?: any; minExperience?: number; minRating?: number }): Promise<{ doctors: IDoctorDocument[]; total: number }> {
    const query: any = {};

    if (filter) {
      if (filter.verificationStatus) {
        query.verificationStatus = filter.verificationStatus;
      }

      if (typeof filter.isActive === 'boolean') {
        query.isActive = filter.isActive;
      }

      if (filter.specialty) {
        query.specialty = { $regex: new RegExp(filter.specialty, "i") };
      }

      if (filter.minExperience !== undefined) {
        query.experienceYears = { $gte: filter.minExperience };
      }

      if (filter.minRating !== undefined) {
        query.ratingAvg = { $gte: filter.minRating };
      }

      if (filter.search) {
        const searchRegex = new RegExp(filter.search, "i");


        const matchingUsers = await this.model.db.model('User').find({
          name: searchRegex
        }).select('_id');

        const userIds = matchingUsers.map(u => u._id);

        query.userId = { $in: userIds };
      }
    } else {
      query.verificationStatus = VerificationStatus.Approved;
    }

    const doctors = await this.model
      .find(query)
      .populate("userId")
      .skip(skip)
      .limit(limit)
      .sort(filter?.sort || { createdAt: -1 })
      .exec();

    const total = await this.model.countDocuments(query);

    return { doctors, total };
  }

  async findRelatedDoctors(specialty: string, currentDoctorId: string, limit: number): Promise<IDoctorDocument[]> {
    const query: any = {
      verificationStatus: VerificationStatus.Approved,
      specialty: { $regex: new RegExp(specialty, "i") },
      _id: { $ne: new Types.ObjectId(currentDoctorId) }
    };

    return await this.model
      .find(query)
      .populate("userId")
      .limit(limit)
      .exec();
  }

  async findPendingVerifications(): Promise<IDoctorDocument[]> {
    return await this.model.find({ verificationStatus: VerificationStatus.Pending }).exec();
  }

  async getPendingDoctorRequests(): Promise<DoctorRequestItem[]> {
    const docs = await this.model
      .find({ verificationStatus: VerificationStatus.Pending })
      .populate("userId")
      .lean();

    const result: DoctorRequestItem[] = [];
    for (let i = 0; i < docs.length; i++) {
      result.push(this.mapDoctorRequestItem(docs[i]));
    }
    return result;
  }

  async getAllDoctorRequests(): Promise<DoctorRequestItem[]> {
    const docs = await this.model
      .find({ verificationStatus: VerificationStatus.Pending })
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean();

    const result: DoctorRequestItem[] = [];
    for (let i = 0; i < docs.length; i++) {
      result.push(this.mapDoctorRequestItem(docs[i]));
    }
    return result;
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
    return await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }




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

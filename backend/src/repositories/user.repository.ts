import { Types } from "mongoose";
import UserModel from "../models/user.model";
import { IUserDocument } from "../types/user.type";
import { BaseRepository } from "./base.repository";
import { IUserRepository } from "./interfaces/IUser.repository";
import { ROLES } from "../constants/constants";

export class UserRepository extends BaseRepository<IUserDocument> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email, isActive: true });
  }

  async findByEmailIncludingInactive(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email });
  }

  async findByPhone(phone: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ phone, isActive: true });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.existsByField("email", email);
  }

  async existsByPhone(phone: string): Promise<boolean> {
    return this.existsByField("phone", phone);
  }

  async findByGoogleId(googleId: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ googleId, isActive: true });
  }

  async findByRole(role: string): Promise<IUserDocument[]> {
    return await this.model.find({ role, isActive: true });
  }

  async getAllPatients(skip: number, limit: number, filter?: { search?: string; isActive?: boolean }): Promise<{ patients: IUserDocument[]; total: number }> {
    const query: Record<string, unknown> = { role: ROLES.PATIENT };

    if (filter) {
      if (typeof filter.isActive === 'boolean') {
        query.isActive = filter.isActive;
      }

      if (filter.search) {
        const searchRegex = new RegExp(filter.search, "i");
        query.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { customId: searchRegex }
        ];
      }
    }

    const patients = await this.model
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await this.model.countDocuments(query);
    return { patients, total };
  }

  async countActivePatients(): Promise<number> {
    return await this.model.countDocuments({ role: ROLES.PATIENT, isActive: true });
  }

  async findByIdPopulatedFavorites(id: string | Types.ObjectId): Promise<IUserDocument | null> {
    return await this.model.findById(id).populate({
      path: 'favorites',
      populate: {
        path: 'userId',
      }
    });
  }
}

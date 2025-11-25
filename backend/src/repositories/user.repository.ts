import UserModel from "../models/user.model";
import { IUserDocument } from "../types/user.type";
import { BaseRepository } from "./base.repository";
import { IUserRepository } from "./interfaces/IUser.repository";

export class UserRepository extends BaseRepository<IUserDocument> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email, isActive: true });
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

  async getAllPatients(skip: number, limit: number): Promise<{ patients: IUserDocument[]; total: number }> {
    const patients = await this.model
      .find({ role: "patient" })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await this.model.countDocuments({ role: "patient" });
    return { patients, total };
  }
}

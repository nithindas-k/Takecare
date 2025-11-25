import OTPModel, { IOTPDocument } from "../models/otp.model";
import { BaseRepository } from "./base.repository";
import { IOTPRepository } from "./interfaces/IOtp.repository";

export class OTPRepository extends BaseRepository<IOTPDocument> implements IOTPRepository {
  constructor() {
    super(OTPModel);
  }

  async findByEmailAndOtp(email: string, otp: string): Promise<IOTPDocument | null> {
    return await this.model.findOne({ email, otp }).exec();
  }

  async updateOtp(email: string, data: { otp: string|null; expiresAt: Date }): Promise<IOTPDocument | null> {
    return await this.model.findOneAndUpdate({ email }, { $set: data }, { new: true }).exec();
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.model.deleteOne({ email }).exec();
  }

  async deleteExpired(): Promise<number> {
    const result = await this.model.deleteMany({ expiresAt: { $lt: new Date() } }).exec();
    return result.deletedCount || 0;
  }

  async isValid(email: string, otp: string): Promise<boolean> {
    const record = await this.model.findOne({ email, otp, expiresAt: { $gt: new Date() } });
    return !!record;
  }

  async findAll(): Promise<IOTPDocument[]> {
    return await this.model.find().exec();
  }

  async count(): Promise<number> {
    return await this.model.countDocuments().exec();
  }
}

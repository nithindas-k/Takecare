
import { Types } from "mongoose";
import { IBaseRepository } from "./IBase.repository";
import { IUserDocument } from "../../types/user.type";


export interface IUserRepository extends IBaseRepository<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByPhone(phone: string): Promise<IUserDocument | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
  findByGoogleId(googleId: string): Promise<IUserDocument | null>;
  findByRole(role: string): Promise<IUserDocument[]>;
  updateById(id: string | Types.ObjectId, update: Partial<IUserDocument>): Promise<IUserDocument | null>;
  getAllPatients(skip: number, limit: number): Promise<{ patients: IUserDocument[]; total: number }>;
}

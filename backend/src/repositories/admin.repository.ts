import UserModel from "../models/user.model";
import  {IUserDocument}  from "../types/user.type";
import { BaseRepository } from "./base.repository";
import { IAdminRepository } from "./interfaces/IDdmin.repository";

export class AdminRepository extends BaseRepository<IUserDocument> implements IAdminRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email, role: "admin", isActive: true });
  }
}

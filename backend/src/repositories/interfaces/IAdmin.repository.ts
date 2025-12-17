import { IBaseRepository } from "./IBase.repository";
import { IUserDocument } from "../../types/user.type";


export interface IAdminRepository extends IBaseRepository<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

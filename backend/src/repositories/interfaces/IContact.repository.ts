import { IBaseRepository } from "./IBase.repository";
import { IContact } from "../../models/contact.model";

export interface IContactRepository extends IBaseRepository<IContact> {
    findAll(): Promise<IContact[]>;
}

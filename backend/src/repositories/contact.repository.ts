import { BaseRepository } from "./base.repository";
import { IContact, ContactModel } from "../models/contact.model";
import { IContactRepository } from "./interfaces/IContact.repository";

export class ContactRepository extends BaseRepository<IContact> implements IContactRepository {
    constructor() {
        super(ContactModel);
    }

    async findAll(): Promise<IContact[]> {
        return await this.model.find({}).sort({ createdAt: -1 }).exec();
    }
}

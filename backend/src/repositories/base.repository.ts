import { Document, Model, Types } from "mongoose";
import { IBaseRepository } from "./interfaces/IBase.repository";

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(item: Partial<T>, session?: any): Promise<T> {
    const doc = new this.model(item);
    return await doc.save({ session });
  }

  async findById(id: string | Types.ObjectId, session?: any): Promise<T | null> {
    return await this.model.findById(id).session(session).exec();
  }

  async updateById(
    id: string | Types.ObjectId,
    update: Partial<T>,
    session?: any
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, { new: true, session }).exec();
  }

  async deleteById(id: string | Types.ObjectId, session?: any): Promise<T | null> {
    return await this.model
      .findByIdAndUpdate(id, { isActive: false }, { new: true, session })
      .exec();
  }

  async findOneByField(fieldName: string, value: unknown, session?: any): Promise<T | null> {
    const query: Record<string, unknown> = {};
    query[fieldName] = value;
    return await this.model.findOne(query).session(session).exec();
  }

  async findOne(filter: Record<string, any>, session?: any): Promise<T | null> {
    return await this.model.findOne(filter).session(session).exec();
  }

  async find(filter: Record<string, any>, session?: any): Promise<T[]> {
    return await this.model.find(filter).session(session).exec();
  }

  async findWithPopulate(filter: Record<string, any>, populateField: string, session?: any): Promise<T[]> {
    return await this.model.find(filter).session(session).populate(populateField).exec();
  }

  async existsByField(fieldName: string, value: unknown, session?: any): Promise<boolean> {
    const query: Record<string, unknown> = {};
    query[fieldName] = value;
    const count = await this.model.countDocuments(query).session(session);
    return count > 0;
  }
}

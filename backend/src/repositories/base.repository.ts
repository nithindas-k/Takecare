import { Document, Model, Types } from "mongoose";
import { IBaseRepository } from "./interfaces/IBase.repository";

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(item: Partial<T>): Promise<T> {
    const doc = new this.model(item);
    return await doc.save();
  }

  async findById(id: string | Types.ObjectId): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  async updateById(
    id: string | Types.ObjectId,
    update: Partial<T>
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async deleteById(id: string | Types.ObjectId): Promise<T | null> {
    return await this.model
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }

  async findOneByField(fieldName: string, value: unknown): Promise<T | null> {
    const query: Record<string, unknown> = {};
    query[fieldName] = value;
    return await this.model.findOne(query).exec();
  }

  async existsByField(fieldName: string, value: unknown): Promise<boolean> {
    const query: Record<string, unknown> = {};
    query[fieldName] = value;
    const count = await this.model.countDocuments(query);
    return count > 0;
  }
}

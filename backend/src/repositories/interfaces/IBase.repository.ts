import { Document, Types } from "mongoose";

export interface IBaseRepository<T extends Document> {
  create(item: Partial<T>): Promise<T>;
  findById(id: string | Types.ObjectId): Promise<T | null>;
  updateById(id: string | Types.ObjectId, update: Partial<T>): Promise<T | null>;
  deleteById(id: string | Types.ObjectId): Promise<T | null>;
  findOneByField(fieldName: string, value: any): Promise<T | null>;
  existsByField(fieldName: string, value: any): Promise<boolean>;
}

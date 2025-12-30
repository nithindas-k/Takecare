import { Document, Types } from "mongoose";

export interface IBaseRepository<T extends Document> {
  create(item: Partial<T>): Promise<T>;
  findById(id: string | Types.ObjectId): Promise<T | null>;
  updateById(id: string | Types.ObjectId, update: Partial<T>): Promise<T | null>;
  deleteById(id: string | Types.ObjectId): Promise<T | null>;
  findOneByField(fieldName: string, value: unknown): Promise<T | null>;
  find(filter: Record<string, any>): Promise<T[]>;
  findWithPopulate(filter: Record<string, any>, populateField: string): Promise<T[]>;
  existsByField(fieldName: string, value: unknown): Promise<boolean>;
}

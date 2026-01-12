import { Document, Types } from "mongoose";

export interface IBaseRepository<T extends Document> {
  create(item: Partial<T>, session?: any): Promise<T>;
  findById(id: string | Types.ObjectId, session?: any): Promise<T | null>;
  updateById(id: string | Types.ObjectId, update: Partial<T>, session?: any): Promise<T | null>;
  deleteById(id: string | Types.ObjectId, session?: any): Promise<T | null>;
  findOneByField(fieldName: string, value: unknown, session?: any): Promise<T | null>;
  findOne(filter: Record<string, any>, session?: any): Promise<T | null>;
  find(filter: Record<string, any>, session?: any): Promise<T[]>;
  findWithPopulate(filter: Record<string, any>, populateField: string, session?: any): Promise<T[]>;
  existsByField(fieldName: string, value: unknown, session?: any): Promise<boolean>;
  countDocuments(filter: Record<string, any>, session?: any): Promise<number>;
}

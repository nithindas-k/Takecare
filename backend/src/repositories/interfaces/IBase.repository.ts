import { Document, Types, ClientSession } from "mongoose";

export interface IBaseRepository<T extends Document> {
  create(item: Partial<T>, session?: ClientSession | undefined): Promise<T>;
  findById(id: string | Types.ObjectId, session?: ClientSession | undefined): Promise<T | null>;
  updateById(id: string | Types.ObjectId, update: Partial<T>, session?: ClientSession | undefined): Promise<T | null>;
  deleteById(id: string | Types.ObjectId, session?: ClientSession | undefined): Promise<T | null>;
  findOneByField(fieldName: string, value: unknown, session?: ClientSession | undefined): Promise<T | null>;
  findOne(filter: Record<string, unknown>, session?: ClientSession | undefined): Promise<T | null>;
  find(filter: Record<string, unknown>, session?: ClientSession | undefined): Promise<T[]>;
  findWithPopulate(filter: Record<string, unknown>, populateField: string, session?: ClientSession | undefined): Promise<T[]>;
  existsByField(fieldName: string, value: unknown, session?: ClientSession | undefined): Promise<boolean>;
  countDocuments(filter: Record<string, unknown>, session?: ClientSession | undefined): Promise<number>;
}

import { ISpecialtyRepository } from "./interfaces/ISpecialtyRepository";
import { Specialty, CreateSpecialtyDTO, UpdateSpecialtyDTO } from "../types/specialty.type";
import SpecialtyModel from "../models/specialty.model";

export class SpecialtyRepository implements ISpecialtyRepository {
  private model = SpecialtyModel;

  async create(data: CreateSpecialtyDTO): Promise<Specialty> {
    const doc = await this.model.create(data);
    return doc.toObject() as Specialty;
  }

  async findById(id: string): Promise<Specialty | null> {
    const doc = await this.model.findById(id);
    return doc ? (doc.toObject() as Specialty) : null;
  }

  async findByName(name: string): Promise<Specialty | null> {
    const doc = await this.model.findOne({ name: new RegExp(`^${name}$`, 'i') });
    return doc ? (doc.toObject() as Specialty) : null;
  }

  async findAll(page: number, limit: number, search?: string): Promise<{ specialties: Specialty[], total: number }> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const [specialties, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query)
    ]);

    return {
      specialties: specialties.map(s => s.toObject() as Specialty),
      total
    };
  }

  async updateById(id: string, data: UpdateSpecialtyDTO): Promise<Specialty | null> {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true });
    return doc ? (doc.toObject() as Specialty) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async toggleActive(id: string): Promise<Specialty | null> {
    const specialty = await this.model.findById(id);
    if (!specialty) return null;

    specialty.isActive = !specialty.isActive;
    const saved = await specialty.save();
    return saved.toObject() as Specialty;
  }

  async getActiveSpecialties(): Promise<Specialty[]> {
    const docs = await this.model.find({ isActive: true }).sort({ name: 1 });
    return docs.map(d => d.toObject() as Specialty);
  }
}

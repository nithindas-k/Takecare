import { ISpecialtyRepository } from "./interfaces/ISpecialtyRepository";
import { Specialty, CreateSpecialtyDTO, UpdateSpecialtyDTO } from "../types/specialty.type";
import SpecialtyModel, { ISpecialtyDocument } from "../models/specialty.model";

export class SpecialtyRepository implements ISpecialtyRepository {
  private model = SpecialtyModel;

  async create(data: CreateSpecialtyDTO): Promise<Specialty> {
    return await this.model.create(data);
  }

  async findById(id: string): Promise<Specialty | null> {
    return await this.model.findById(id);
  }

  async findByName(name: string): Promise<Specialty | null> {
    return await this.model.findOne({ name: new RegExp(`^${name}$`, 'i') });
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
        .limit(limit),
      this.model.countDocuments(query)
    ]);

    return { specialties, total };
  }

  async updateById(id: string, data: UpdateSpecialtyDTO): Promise<Specialty | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async toggleActive(id: string): Promise<Specialty | null> {
    const specialty = await this.model.findById(id);
    if (!specialty) return null;

    specialty.isActive = !specialty.isActive;
    return await specialty.save();
  }

  async getActiveSpecialties(): Promise<Specialty[]> {
    return await this.model.find({ isActive: true }).sort({ name: 1 });
  }
}

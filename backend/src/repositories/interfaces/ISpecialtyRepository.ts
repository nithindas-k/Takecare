import { Specialty, CreateSpecialtyDTO, UpdateSpecialtyDTO } from "../../types/specialty.type";

export interface ISpecialtyRepository {
  create(data: CreateSpecialtyDTO): Promise<Specialty>;
  findById(id: string): Promise<Specialty | null>;
  findByName(name: string): Promise<Specialty | null>;
  findAll(page: number, limit: number, search?: string): Promise<{ specialties: Specialty[], total: number }>;
  updateById(id: string, data: UpdateSpecialtyDTO): Promise<Specialty | null>;
  deleteById(id: string): Promise<boolean>;
  toggleActive(id: string): Promise<Specialty | null>;
  getActiveSpecialties(): Promise<Specialty[]>;
}

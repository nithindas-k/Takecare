import { Specialty, CreateSpecialtyDTO, UpdateSpecialtyDTO, SpecialtyListResponse } from "../../types/specialty.type";

export interface ISpecialtyService {
  createSpecialty(data: CreateSpecialtyDTO): Promise<Specialty>;
  getSpecialtyById(id: string): Promise<Specialty | null>;
  getAllSpecialties(page: number, limit: number, search?: string): Promise<SpecialtyListResponse>;
  updateSpecialty(id: string, data: UpdateSpecialtyDTO): Promise<Specialty | null>;
  deleteSpecialty(id: string): Promise<boolean>;
  toggleSpecialtyStatus(id: string): Promise<Specialty | null>;
  getActiveSpecialties(): Promise<Specialty[]>;
}

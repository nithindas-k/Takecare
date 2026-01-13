import { ISpecialtyService } from "./interfaces/ISpecialtyService";
import { Specialty, CreateSpecialtyDTO, UpdateSpecialtyDTO, SpecialtyListResponse } from "../types/specialty.type";
import { ISpecialtyRepository } from "../repositories/interfaces/ISpecialtyRepository";
import { MESSAGES, STATUS, PAGINATION } from "../constants/constants";
import { AppError, NotFoundError, ConflictError } from "../errors/AppError";
import { ILoggerService } from "./interfaces/ILogger.service";

export class SpecialtyService implements ISpecialtyService {
  constructor(
    private _specialtyRepository: ISpecialtyRepository,
    private _logger: ILoggerService
  ) {
  }

  async createSpecialty(data: CreateSpecialtyDTO): Promise<Specialty> {
    const existingSpecialty = await this._specialtyRepository.findByName(data.name);
    if (existingSpecialty) {
      throw new ConflictError("Specialty with this name already exists");
    }

    const specialty = await this._specialtyRepository.create(data);
    this._logger.info(`Specialty created: ${specialty.name}`);
    return specialty;
  }

  async getSpecialtyById(id: string): Promise<Specialty | null> {
    const specialty = await this._specialtyRepository.findById(id);
    if (!specialty) {
      throw new NotFoundError("Specialty not found");
    }
    return specialty;
  }

  async getAllSpecialties(page: number = PAGINATION.DEFAULT_PAGE, limit: number = PAGINATION.DEFAULT_LIMIT, search?: string): Promise<SpecialtyListResponse> {
    const { specialties, total } = await this._specialtyRepository.findAll(page, limit, search);

    return {
      specialties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateSpecialty(id: string, data: UpdateSpecialtyDTO): Promise<Specialty | null> {
    const specialty = await this._specialtyRepository.findById(id);
    if (!specialty) {
      throw new NotFoundError("Specialty not found");
    }

    if (data.name && data.name !== specialty.name) {
      const existingSpecialty = await this._specialtyRepository.findByName(data.name);
      if (existingSpecialty) {
        throw new ConflictError("Specialty with this name already exists");
      }
    }

    const updatedSpecialty = await this._specialtyRepository.updateById(id, data);
    this._logger.info(`Specialty updated: ${updatedSpecialty?.name}`);
    return updatedSpecialty;
  }

  async deleteSpecialty(id: string): Promise<boolean> {
    const specialty = await this._specialtyRepository.findById(id);
    if (!specialty) {
      throw new NotFoundError("Specialty not found");
    }

    const deleted = await this._specialtyRepository.deleteById(id);
    if (deleted) {
      this._logger.info(`Specialty deleted: ${specialty.name}`);
    }
    return deleted;
  }

  async toggleSpecialtyStatus(id: string): Promise<Specialty | null> {
    const specialty = await this._specialtyRepository.findById(id);
    if (!specialty) {
      throw new NotFoundError("Specialty not found");
    }

    const updatedSpecialty = await this._specialtyRepository.toggleActive(id);
    this._logger.info(`Specialty status toggled: ${updatedSpecialty?.name} - ${updatedSpecialty?.isActive ? 'Active' : 'Inactive'}`);
    return updatedSpecialty;
  }

  async getActiveSpecialties(): Promise<Specialty[]> {
    return await this._specialtyRepository.getActiveSpecialties();
  }
}

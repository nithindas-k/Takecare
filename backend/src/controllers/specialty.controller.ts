import { Request, Response, NextFunction } from "express";
import { ISpecialtyService } from "../services/interfaces/ISpecialtyService";
import { STATUS, PAGINATION } from "../constants/constants";
import { ILoggerService } from "../services/interfaces/ILogger.service";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../errors/AppError";
import { CreateSpecialtyDTO, UpdateSpecialtyDTO } from "../types/specialty.type";

export class SpecialtyController {
  constructor(
    private _specialtyService: ISpecialtyService,
    private logger: ILoggerService
  ) {
  }

  createSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description } = req.body as CreateSpecialtyDTO;

      if (!name || name.trim().length === 0) {
        throw new AppError("Specialty name is required", STATUS.BAD_REQUEST);
      }

      const specialty = await this._specialtyService.createSpecialty({ name: name.trim(), description });
      sendSuccess(res, specialty, "Specialty created successfully", STATUS.CREATED);
    } catch (error: unknown) {
      next(error);
    }
  };

  getSpecialtyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const specialty = await this._specialtyService.getSpecialtyById(id);
      sendSuccess(res, specialty, "Specialty fetched successfully", STATUS.OK);
    } catch (error: unknown) {
      next(error);
    }
  };

  getAllSpecialties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
      const search = req.query.search as string;

      const result = await this._specialtyService.getAllSpecialties(page, limit, search);
      sendSuccess(res, result, "Specialties fetched successfully", STATUS.OK);
    } catch (error: unknown) {
      next(error);
    }
  };

  updateSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body as UpdateSpecialtyDTO;

      const updateData: UpdateSpecialtyDTO = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      const specialty = await this._specialtyService.updateSpecialty(id, updateData);
      sendSuccess(res, specialty, "Specialty updated successfully", STATUS.OK);
    } catch (error: unknown) {
      next(error);
    }
  };

  deleteSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this._specialtyService.deleteSpecialty(id);
      sendSuccess(res, null, "Specialty deleted successfully", STATUS.OK);
    } catch (error: unknown) {
      next(error);
    }
  };

  toggleSpecialtyStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const specialty = await this._specialtyService.toggleSpecialtyStatus(id);
      sendSuccess(res, specialty, "Specialty status updated successfully", STATUS.OK);
    } catch (error: unknown) {
      next(error);
    }
  };

  getActiveSpecialties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const specialties = await this._specialtyService.getActiveSpecialties();
      sendSuccess(res, specialties, "Active specialties fetched successfully", STATUS.OK);
    } catch (error: unknown) {
      next(error);
    }
  };
}

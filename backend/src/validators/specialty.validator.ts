import { Request, Response, NextFunction } from "express";
import { STATUS } from "../constants/constants";
import { CreateSpecialtyDTO, UpdateSpecialtyDTO } from "../types/specialty.type";

export const validateSpecialtyCreation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, description } = req.body as CreateSpecialtyDTO;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "Specialty name is required and must be a non-empty string"
      });
      return;
    }

    if (name.trim().length > 100) {
      res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "Specialty name must be less than 100 characters"
      });
      return;
    }

    if (description && (typeof description !== 'string' || description.trim().length > 500)) {
      res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "Description must be a string with less than 500 characters"
      });
      return;
    }

    next();
  } catch (_error) {
    res.status(STATUS.INTERNAL_ERROR).json({
      success: false,
      message: "Validation error occurred"
    });
  }
};

export const validateSpecialtyUpdate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, description, isActive } = req.body as UpdateSpecialtyDTO;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: "Specialty name must be a non-empty string"
        });
        return;
      }

      if (name.trim().length > 100) {
        res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: "Specialty name must be less than 100 characters"
        });
        return;
      }
    }

    if (description !== undefined && (typeof description !== 'string' || description.trim().length > 500)) {
      res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "Description must be a string with less than 500 characters"
      });
      return;
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "isActive must be a boolean value"
      });
      return;
    }

    next();
  } catch (_error) {
    res.status(STATUS.INTERNAL_ERROR).json({
      success: false,
      message: "Validation error occurred"
    });
  }
};

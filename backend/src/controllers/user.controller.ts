import { Request, Response, NextFunction } from "express";
import { IUserService } from "../services/interfaces/IUserService";
import { sendSuccess } from "../utils/response.util";
import { MESSAGES, HttpStatus } from "../constants/constants";
import { AppError } from "../types/error.type";
import { UnifiedUpdateProfileDTO } from "../dtos/user.dtos/user.dto";

export class UserController {
  private userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
  }

  private getUserIdFromReq(req: Request): string | undefined {
    return req.user?.userId || req.user?._id?.toString() || req.user?.id;
  }

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      if (!userId) {
        throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const result = await this.userService.getUserProfile(userId);
      sendSuccess(res, result, MESSAGES.PROFILE_FETCHED, HttpStatus.OK);
    } catch (error: unknown) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      if (!userId) {
        throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      }

      const dto: UnifiedUpdateProfileDTO = req.body;

      if (typeof req.body.information === 'string') {
        try {
          dto.information = JSON.parse(req.body.information);
        } catch {

        }
      }

      if (typeof req.body.additionalInformation === 'string') {
        try {
          dto.additionalInformation = JSON.parse(req.body.additionalInformation);
        } catch {

        }
      }

      const file = req.file;

      const result = await this.userService.updateUserProfile(userId, dto, file);
      sendSuccess(res, result, MESSAGES.PROFILE_UPDATED, HttpStatus.OK);
    } catch (error: unknown) {
      next(error);
    }
  };

  toggleFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      const { doctorId } = req.params;
      if (!userId) throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
      if (!doctorId) throw new AppError("Doctor ID required", HttpStatus.BAD_REQUEST);

      const isAdded = await this.userService.toggleFavoriteDoctor(userId, doctorId);
      sendSuccess(res, { isAdded }, isAdded ? "Added to favorites" : "Removed from favorites", HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      if (!userId) throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

      const favorites = await this.userService.getFavoriteDoctors(userId);
      sendSuccess(res, favorites, "Favorites fetched", HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

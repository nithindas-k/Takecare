import { Request, Response, NextFunction } from "express";
import type { SubmitVerificationDTO } from "../dtos/doctor.dtos/doctor.dto";
import type { IDoctorService } from "../services/interfaces/IDoctorService";
import { STATUS, MESSAGES } from "../constants/constants";
import { IDoctorController } from "./interfaces/IDoctor.controller";
import { AppError } from "../types/error.type";
import { sendSuccess } from "../utils/response.util";

export class DoctorController implements IDoctorController {
  constructor(private _doctorService: IDoctorService) { }

  private getUserIdFromReq(req: Request): string | undefined {
    return req.user?.userId;
  }

  submitVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      if (!userId) {
        throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
      }

      const dto: SubmitVerificationDTO = {
        degree: String(req.body.degree || ""),
        experience: Number.parseInt(String(req.body.experience || "0"), 10),
        speciality: String(req.body.speciality || ""),
        videoFees: Number.parseFloat(String(req.body.videoFees || "0")),
        chatFees: Number.parseFloat(String(req.body.chatFees || "0")),
        licenseNumber: req.body.licenseNumber ? String(req.body.licenseNumber) : undefined,
        languages: req.body.languages ? JSON.parse(String(req.body.languages)) : [],
      };

      const files = (req.files as Express.Multer.File[]) || [];
      if (!files || files.length === 0) {
        throw new AppError("Please upload at least one verification document", STATUS.BAD_REQUEST);
      }

      const result = await this._doctorService.submitVerification(userId, dto, files);

      sendSuccess(res, {
        verificationStatus: result.verificationStatus,
        documents: result.verificationDocuments,
      }, result.message || MESSAGES.VERIFICATION_SUBMITTED, STATUS.OK);
    } catch (error: unknown) {
      return next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      if (!userId) {
        throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
      }

      const result = await this._doctorService.getProfile(userId);

      sendSuccess(res, result, "Profile fetched successfully", STATUS.OK);
    } catch (error: unknown) {
      return next(error);
    }
  };
}

export default DoctorController;

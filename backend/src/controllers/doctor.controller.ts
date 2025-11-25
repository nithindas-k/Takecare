import { Request, Response, NextFunction } from "express";
import type { SubmitVerificationDTO } from "../dtos/doctor.dtos/doctor.dto";
import type { IDoctorService } from "../services/interfaces/IDoctorService";
import { STATUS, MESSAGES } from "../constants/constants";
import { IDoctorController } from "./interfaces/IDoctor.controller";

export class DoctorController implements IDoctorController {
  constructor(private _doctorService: IDoctorService) { }

  private getUserIdFromReq(req: Request): string | undefined {
    return (req as any).user?.userId;
  }

  submitVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      if (!userId) {
        const err: any = new Error(MESSAGES.UNAUTHORIZED);
        err.status = STATUS.UNAUTHORIZED;
        return next(err);
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
        const err: any = new Error("Please upload at least one verification document");
        err.status = STATUS.BAD_REQUEST;
        return next(err);
      }

      const result = await this._doctorService.submitVerification(userId, dto, files);

      res.status(STATUS.OK).json({
        success: true,
        message: result.message || MESSAGES.VERIFICATION_SUBMITTED,
        data: {
          verificationStatus: result.verificationStatus,
          documents: result.verificationDocuments,
        },
      });
    } catch (error) {
      return next(error);
    }
  };
}

export default DoctorController;

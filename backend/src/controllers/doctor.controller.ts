import { Request, Response, NextFunction } from "express";
import type { SubmitVerificationDTO, UpdateDoctorProfileDTO } from "../dtos/doctor.dtos/doctor.dto";
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


      const hasExistingDocuments = req.body.hasExistingDocuments === 'true';
      const existingDocuments = req.body.existingDocuments
        ? JSON.parse(req.body.existingDocuments)
        : [];

      if (!files.length && !hasExistingDocuments) {
        throw new AppError(MESSAGES.DOCTOR_MISSING_DOCUMENTS, STATUS.BAD_REQUEST);
      }

      const result = await this._doctorService.submitVerification(
        userId,
        dto,
        files,
        hasExistingDocuments,
        existingDocuments
      );

      sendSuccess(res, {
        verificationStatus: result.verificationStatus,
        documents: result.verificationDocuments,
      }, result.message || MESSAGES.VERIFICATION_SUBMITTED, STATUS.OK);
    } catch (error: unknown) {
      // console.error("=== CONTROLLER ERROR ===", error);
      return next(error);
    }
  };
  getVerificationFormData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      if (!userId) {
        throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
      }

      const result = await this._doctorService.getVerificationFormData(userId);
      sendSuccess(res, result, MESSAGES.PROFILE_FETCHED, STATUS.OK);
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

      sendSuccess(res, result, MESSAGES.PROFILE_FETCHED, STATUS.OK);
    } catch (error: unknown) {
      return next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      if (!userId) {
        throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
      }

      let bodyData = { ...req.body };


      if (req.body.information) {
        try {
          const info = JSON.parse(req.body.information);
          bodyData = { ...bodyData, ...info };
        } catch (_e) {
          // console.error("Error parsing information:", e);
        }
      }

      if (req.body.additionalInformation) {
        try {
          const additionalInfo = JSON.parse(req.body.additionalInformation);
          bodyData = { ...bodyData, ...additionalInfo };
        } catch (_e) {
          // console.error("Error parsing additionalInformation:", e);
        }
      }

      const dto: UpdateDoctorProfileDTO = {
        name: bodyData.name ? String(bodyData.name) : undefined,
        phone: bodyData.phone ? String(bodyData.phone) : undefined,
        gender: bodyData.gender ? String(bodyData.gender) as "male" | "female" | "other" : undefined,
        dob: bodyData.dob ? String(bodyData.dob) : undefined,
        specialty: bodyData.specialty ? String(bodyData.specialty) : undefined,
        licenseNumber: bodyData.licenseNumber ? String(bodyData.licenseNumber) : undefined,
        experienceYears: bodyData.experienceYears && String(bodyData.experienceYears).trim() ? Number.parseInt(String(bodyData.experienceYears), 10) : undefined,
        VideoFees: bodyData.VideoFees && String(bodyData.VideoFees).trim() ? Number.parseFloat(String(bodyData.VideoFees)) : undefined,
        ChatFees: bodyData.ChatFees && String(bodyData.ChatFees).trim() ? Number.parseFloat(String(bodyData.ChatFees)) : undefined,
        languages: bodyData.languages && (Array.isArray(bodyData.languages) || String(bodyData.languages).trim()) ? (Array.isArray(bodyData.languages) ? bodyData.languages : JSON.parse(String(bodyData.languages))) : undefined,
        qualifications: bodyData.qualifications && (Array.isArray(bodyData.qualifications) || String(bodyData.qualifications).trim()) ? (Array.isArray(bodyData.qualifications) ? bodyData.qualifications : JSON.parse(String(bodyData.qualifications))) : undefined,
        about: bodyData.about ? String(bodyData.about) : undefined,
      };

      const profileImage = req.file;
      const removeProfileImage = req.body.removeProfileImage === 'true';

      const result = await this._doctorService.updateProfile(userId, dto, profileImage, removeProfileImage);

      sendSuccess(res, result, MESSAGES.PROFILE_UPDATED, STATUS.OK);
    } catch (error: unknown) {
      return next(error);
    }
  };

  getVerifiedDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query.query as string | undefined;
      const specialty = req.query.specialty as string | undefined;
      const page = req.query.page ? Number.parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? Number.parseInt(String(req.query.limit), 10) : 10;
      const sort = req.query.sort as string | undefined;
      const experience = req.query.experience ? Number.parseInt(String(req.query.experience), 10) : undefined;
      const rating = req.query.rating ? Number.parseFloat(String(req.query.rating)) : undefined;

      const result = await this._doctorService.getVerifiedDoctors(query, specialty, page, limit, sort, experience, rating);

      sendSuccess(res, result, MESSAGES.DOCTOR_FETCHED, STATUS.OK);
    } catch (error: unknown) {
      return next(error);
    }
  };

  getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.id;
      if (!doctorId) {
        throw new AppError(MESSAGES.DOCTOR_ID_REQUIRED, STATUS.BAD_REQUEST);
      }

      const result = await this._doctorService.getDoctorById(doctorId);

      sendSuccess(res, result, MESSAGES.DOCTOR_FETCHED, STATUS.OK);
    } catch (error: unknown) {
      return next(error);
    }
  };

  getRelatedDocs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.id;
      if (!doctorId) {
        throw new AppError(MESSAGES.DOCTOR_ID_REQUIRED, STATUS.BAD_REQUEST);
      }

      const result = await this._doctorService.getRelatedDoctors(doctorId);

      sendSuccess(res, result, MESSAGES.DOCTOR_FETCHED, STATUS.OK);
    } catch (error: unknown) {
      return next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserIdFromReq(req);
      // console.log("DoctorController.getDashboardStats userId:", userId);
      if (!userId) {
        throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
      }

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const stats = await this._doctorService.getDashboardStats(userId, startDate, endDate);
      // console.log("DoctorController.getDashboardStats stats:", stats);
      sendSuccess(res, stats);
    } catch (error: unknown) {
      return next(error);
    }
  };

  getLandingPageStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this._doctorService.getLandingPageStats();
      sendSuccess(res, stats);
    } catch (error: unknown) {
      return next(error);
    }
  };
}

export default DoctorController;

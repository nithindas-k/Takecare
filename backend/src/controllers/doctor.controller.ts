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

    console.log("=== CONTROLLER DEBUG ===");
    console.log("req.files:", req.files);
    console.log("req.files type:", typeof req.files);
    console.log("Is Array:", Array.isArray(req.files));

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

    console.log("Parsed files length:", files.length);
    if (files.length > 0) {
      console.log("File paths:", files.map(f => f.path));
    }

    const hasExistingDocuments = req.body.hasExistingDocuments === 'true';
    const existingDocuments = req.body.existingDocuments 
      ? JSON.parse(req.body.existingDocuments) 
      : [];
      
    console.log("hasExistingDocuments:", hasExistingDocuments);
    console.log("existingDocuments:", existingDocuments);

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
    console.error("=== CONTROLLER ERROR ===", error);
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

      const dto: UpdateDoctorProfileDTO = {
        name: req.body.name ? String(req.body.name) : undefined,
        phone: req.body.phone ? String(req.body.phone) : undefined,
        gender: req.body.gender ? String(req.body.gender) as "male" | "female" | "other" : undefined,
        dob: req.body.dob ? String(req.body.dob) : undefined,
        specialty: req.body.specialty ? String(req.body.specialty) : undefined,
        licenseNumber: req.body.licenseNumber ? String(req.body.licenseNumber) : undefined,
        experienceYears: req.body.experienceYears && String(req.body.experienceYears).trim() ? Number.parseInt(String(req.body.experienceYears), 10) : undefined,
        VideoFees: req.body.VideoFees && String(req.body.VideoFees).trim() ? Number.parseFloat(String(req.body.VideoFees)) : undefined,
        ChatFees: req.body.ChatFees && String(req.body.ChatFees).trim() ? Number.parseFloat(String(req.body.ChatFees)) : undefined,
        languages: req.body.languages && String(req.body.languages).trim() ? JSON.parse(String(req.body.languages)) : undefined,
        qualifications: req.body.qualifications && String(req.body.qualifications).trim() ? JSON.parse(String(req.body.qualifications)) : undefined,
        about: req.body.about ? String(req.body.about) : undefined,
      };

      const profileImage = req.file;

      const result = await this._doctorService.updateProfile(userId, dto, profileImage);

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

      const result = await this._doctorService.getVerifiedDoctors(query, specialty, page, limit, sort);

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
}

export default DoctorController;

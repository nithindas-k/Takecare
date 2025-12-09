import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../services/interfaces/IAdminService";
import { IAdminController } from "./interfaces/IAdmin.controller";
import { sendSuccess, sendError } from "../utils/response.util";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../constants/constants";

export class AdminController implements IAdminController {

  constructor(private _adminservice: IAdminService) {
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body;
      if (!dto.email || !dto.password) {
        throw new AppError("Email and password are required", 400);
      }
      const result = await this._adminservice.loginAdmin(dto);
      sendSuccess(res, { user: result.user, token: result.token }, "Login successful");
    } catch (err: unknown) {
      next(err);
    }
  };

  getDoctorRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const docs = await this._adminservice.getDoctorRequests();
      sendSuccess(res, docs);
    } catch (err: unknown) {
      next(err);
    }
  };

  getDoctorRequestDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.params.doctorId;
      const doc = await this._adminservice.getDoctorRequestDetail(doctorId);

      if (!doc) {
        throw new AppError("Doctor not found", 404);
      }

      const baseURL = `${req.protocol}://${req.get("host")}`;

      if (doc.documents && doc.documents.length > 0) {
        doc.documents = doc.documents.map((p) => {
          if (p.startsWith("http") || p.startsWith("https")) {
            return p;
          }
          return baseURL + p;
        });
      }

      sendSuccess(res, doc);
    } catch (err: unknown) {
      next(err);
    }
  };

  approveDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.params.doctorId;
      await this._adminservice.approveDoctorRequest(doctorId);
      sendSuccess(res, undefined, "Doctor approved successfully");
    } catch (err: unknown) {
      next(err);
    }
  };

  rejectDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.params.doctorId;
      const reason = req.body.reason || "Application rejected by admin";
      await this._adminservice.rejectDoctorRequest(doctorId, reason);
      sendSuccess(res, undefined, "Doctor rejected successfully");
    } catch (err: unknown) {
      next(err);
    }
  };

  getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this._adminservice.getAllDoctors(page, limit);
      sendSuccess(res, result);
    } catch (err: unknown) {
      next(err);
    }
  };

  banDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.params.doctorId;
      await this._adminservice.banDoctor(doctorId);
      sendSuccess(res, undefined, "Doctor banned successfully");
    } catch (err: unknown) {
      next(err);
    }
  };

  unbanDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.params.doctorId;
      await this._adminservice.unbanDoctor(doctorId);
      sendSuccess(res, undefined, "Doctor unbanned successfully");
    } catch (err: unknown) {
      next(err);
    }
  };

  getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this._adminservice.getAllPatients(page, limit);
      sendSuccess(res, result);
    } catch (err: unknown) {
      next(err);
    }
  };

  getPatientById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId;
      const patient = await this._adminservice.getPatientById(patientId);

      if (!patient) {
        throw new AppError("Patient not found", 404);
      }

      sendSuccess(res, patient);
    } catch (err: unknown) {
      next(err);
    }
  };

  blockPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId;
      await this._adminservice.blockUser(patientId);
      sendSuccess(res, undefined, "Patient blocked successfully");
    } catch (err: unknown) {
      next(err);
    }
  };

  unblockPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId;
      await this._adminservice.unblockUser(patientId);
      sendSuccess(res, undefined, "Patient unblocked successfully");
    } catch (err: unknown) {
      next(err);
    }
  };
}

import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../services/interfaces/IAdminService";
import { IAdminController } from "./interfaces/IAdmin.controller";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../errors/AppError";
import { MESSAGES, HttpStatus, PAGINATION } from "../constants/constants";

export class AdminController implements IAdminController {

  constructor(private _adminservice: IAdminService) {
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body;
      if (!dto.email || !dto.password) {
        throw new AppError(MESSAGES.EMAIL_PASSWORD_REQUIRED, HttpStatus.BAD_REQUEST);
      }
      const result = await this._adminservice.loginAdmin(dto);
      sendSuccess(res, { user: result.user, token: result.token }, MESSAGES.LOGIN_SUCCESS);
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
      const baseURL = `${req.protocol}://${req.get("host")}`;
      const doc = await this._adminservice.getDoctorRequestDetail(doctorId, baseURL);

      if (!doc) {
        throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);
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
      sendSuccess(res, undefined, MESSAGES.DOCTOR_APPROVED_SUCCESS);
    } catch (err: unknown) {
      next(err);
    }
  };

  rejectDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.params.doctorId;
      const reason = req.body.reason || MESSAGES.DOCTOR_APPLICATION_REJECTED;
      await this._adminservice.rejectDoctorRequest(doctorId, reason);
      sendSuccess(res, undefined, MESSAGES.DOCTOR_REJECTED_SUCCESS);
    } catch (err: unknown) {
      next(err);
    }
  };

  getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        search: req.query.search as string,
        specialty: req.query.specialty as string,
        verificationStatus: req.query.verificationStatus as string,
        isActive: req.query.isActive as any,
        page: parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT,
      };

      const result = await this._adminservice.getAllDoctors(filters);
      sendSuccess(res, result);
    } catch (err: unknown) {
      next(err);
    }
  };

  banDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.params.doctorId;
      await this._adminservice.banDoctor(doctorId);
      sendSuccess(res, undefined, MESSAGES.DOCTOR_BANNED_SUCCESS);
    } catch (err: unknown) {
      next(err);
    }
  };

  unbanDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.params.doctorId;
      await this._adminservice.unbanDoctor(doctorId);
      sendSuccess(res, undefined, MESSAGES.DOCTOR_UNBANNED_SUCCESS);
    } catch (err: unknown) {
      next(err);
    }
  };

  getAllPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        search: req.query.search as string,
        isActive: req.query.isActive as any,
        page: parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT,
      };

      const result = await this._adminservice.getAllPatients(filters);
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
        throw new AppError(MESSAGES.PATIENT_NOT_FOUND, HttpStatus.NOT_FOUND);
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
      sendSuccess(res, undefined, MESSAGES.PATIENT_BLOCKED_SUCCESS);
    } catch (err: unknown) {
      next(err);
    }
  };

  unblockPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId;
      await this._adminservice.unblockUser(patientId);
      sendSuccess(res, undefined, MESSAGES.PATIENT_UNBLOCKED_SUCCESS);
    } catch (err: unknown) {
      next(err);
    }
  };
}

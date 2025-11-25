import { Request, Response } from "express";
import { IAdminService } from "../services/interfaces/IAdminService";
import { IAdminController } from "./interfaces/IAdmin.controller";

export class AdminController implements IAdminController {

  constructor(private _adminservice: IAdminService) {
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body;
      if (!dto.email || !dto.password) {
        res
          .status(400)
          .json({ success: false, message: "Email and password are required" });
        return;
      }
      const result = await this._adminservice.loginAdmin(dto);
      res.status(200).json({
        success: true,
        token: result.token,
        message: "Login successful",
        data: result.user,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: err.message || "Login failed",
      });
    }
  };

  getDoctorRequests = async (req: Request, res: Response) => {
    try {
      const docs = await this._adminservice.getDoctorRequests();
      res.status(200).json({ success: true, data: docs });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          message: err.message || "Failed to fetch doctor requests",
        });
    }
  };

  getDoctorRequestDetails = async (req: Request, res: Response) => {
    try {
      const doctorId = req.params.doctorId;
      const doc = await this._adminservice.getDoctorRequestDetail(doctorId);

      if (!doc) {
        res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
          return;
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

      res.status(200).json({ success: true, data: doc });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          message: err.message || "Failed to fetch doctor details",
        });
    }
  };

  approveDoctor = async (req: Request, res: Response) => {
    try {
      const doctorId = req.params.doctorId;
      await this._adminservice.approveDoctorRequest(doctorId);
      res.status(200).json({
        success: true,
        message: "Doctor approved successfully"
      });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          message: err.message || "Failed to approve doctor",
        });
    }
  };

  rejectDoctor = async (req: Request, res: Response) => {
    try {
      const doctorId = req.params.doctorId;
      const reason = req.body.reason || "Application rejected by admin";
      await this._adminservice.rejectDoctorRequest(doctorId, reason);
      res.status(200).json({
        success: true,
        message: "Doctor rejected successfully"
      });
    } catch (err: any) {
      res
        .status(500)
        .json({
          success: false,
          message: err.message || "Failed to reject doctor",
        });
    }
  };

  getAllDoctors = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this._adminservice.getAllDoctors(page, limit);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch doctors",
      });
    }
  };

  banDoctor = async (req: Request, res: Response) => {
    try {
      const doctorId = req.params.doctorId;
      await this._adminservice.banDoctor(doctorId);
      res.status(200).json({ success: true, message: "Doctor banned successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to ban doctor" });
    }
  };

  unbanDoctor = async (req: Request, res: Response) => {
    try {
      const doctorId = req.params.doctorId;
      await this._adminservice.unbanDoctor(doctorId);
      res.status(200).json({ success: true, message: "Doctor unbanned successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to unban doctor" });
    }
  };

  getAllPatients = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this._adminservice.getAllPatients(page, limit);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch patients",
      });
    }
  };

  getPatientById = async (req: Request, res: Response) => {
    try {
      const patientId = req.params.patientId;
      const patient = await this._adminservice.getPatientById(patientId);

      if (!patient) {
        res.status(404).json({ success: false, message: "Patient not found" });
        return;
      }

      res.status(200).json({ success: true, data: patient });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch patient details",
      });
    }
  };

  blockPatient = async (req: Request, res: Response) => {
    try {
      const patientId = req.params.patientId;
      await this._adminservice.blockUser(patientId);
      res.status(200).json({ success: true, message: "Patient blocked successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to block patient" });
    }
  };

  unblockPatient = async (req: Request, res: Response) => {
    try {
      const patientId = req.params.patientId;
      await this._adminservice.unblockUser(patientId);
      res.status(200).json({ success: true, message: "Patient unblocked successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to unblock patient" });
    }
  };
}

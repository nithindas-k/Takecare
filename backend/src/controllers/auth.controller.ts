import { Request, Response, NextFunction } from "express";
import {
  RegisterDTO,
  LoginDTO,
  VerifyOtpDTO,
  ResendOtpDTO,
  ForgotPasswordDTO,
  ForgotPasswordVerifyOtpDTO,
  ResetPasswordDTO,
  Role,
} from "../dtos/common.dto";
import { STATUS, MESSAGES } from "../constants/constants";
import { IAuthService } from "../services/interfaces/IAuthService";
import { IAuthController } from "./interfaces/IAuth.controller";

export class AuthController implements IAuthController {

  constructor(private _authService: IAuthService) { }


  private parseRole(role?: string): Role {
    if (!role) return Role.Patient as Role;
    const r = String(role).toLowerCase();
    if (r === Role.Patient) return Role.Patient as Role;
    if (r === Role.Doctor) return Role.Doctor as Role;
    if (r === Role.Admin) return Role.Admin as Role;
    const err: any = new Error(MESSAGES.INVALID_ROLE);
    err.status = STATUS.BAD_REQUEST;
    throw err;
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: RegisterDTO = req.body;
      const role = this.parseRole(dto.role as any);

      if (!dto.name || !dto.email || !dto.phone || !dto.password || !dto.confirmPassword) {
        const err: any = new Error(MESSAGES.MISSING_FIELDS);
        err.status = STATUS.BAD_REQUEST;
        throw err;
      }

      const result = await this._authService.register({
        ...dto,
        role,
      });

       res.status(STATUS.OK).json({
        success: true,
        message: MESSAGES.OTP_SENT,
        data: result,
      });
    } catch (err) {
       next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: VerifyOtpDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      if (!dto.email || !dto.otp) {
        const err: any = new Error(MESSAGES.MISSING_FIELDS);
        err.status = STATUS.BAD_REQUEST;
        throw err;
      }

      const result = await this._authService.verifyOtp({ email: dto.email, otp: dto.otp, role });

       res.status(STATUS.CREATED).json({
        success: true,
        message: MESSAGES.REGISTRATION_COMPLETE,
        data: result,
      });
    } catch (err) {
       next(err);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const dto: ResendOtpDTO = req.body;
      if (!dto.email) {
        const err: any = new Error("Email is required");
        err.status = STATUS.BAD_REQUEST;
        throw err;
      }

      await this._authService.resendOtp(dto);
       res.status(STATUS.OK).json({ success: true, message: MESSAGES.OTP_RESENT });
    } catch (err) {
      return next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: LoginDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      if (!dto.email || !dto.password) {
        const err: any = new Error(MESSAGES.MISSING_FIELDS);
        err.status = STATUS.BAD_REQUEST;
        throw err;
      }

      const result = await this._authService.login({ email: dto.email, password: dto.password, role });
       res.status(STATUS.OK).json({ success: true, message: MESSAGES.LOGIN_SUCCESS, data: result });
    } catch (err) {
       next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ForgotPasswordDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      if (!dto.email) {
        const err: any = new Error("Email is required");
        err.status = STATUS.BAD_REQUEST;
        throw err;
      }

      await this._authService.forgotPassword({ email: dto.email, role });
       res.status(STATUS.OK).json({ success: true, message: MESSAGES.PASSWORD_RESET_OTP });
    } catch (err) {
       next(err);
    }
  };

  forgotPasswordVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ForgotPasswordVerifyOtpDTO = req.body;
      if (!dto.email || !dto.otp) {
        const err: any = new Error(MESSAGES.MISSING_FIELDS);
        err.status = STATUS.BAD_REQUEST;
        throw err;
      }
      const result = await this._authService.forgotPasswordVerifyOtp(dto);
       res.status(STATUS.OK).json({ success: true, message: MESSAGES.OTP_VERIFIED, data: result });
    } catch (err) {
       next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ResetPasswordDTO = req.body;
      if (!dto.email || !dto.resetToken || !dto.newPassword || !dto.confirmPassword) {
        const err: any = new Error(MESSAGES.MISSING_FIELDS);
        err.status = STATUS.BAD_REQUEST;
        throw err;
      }
      await this._authService.resetPassword(dto);
       res.status(STATUS.OK).json({ success: true, message: MESSAGES.PASSWORD_RESET_SUCCESS });
    } catch (err) {
       next(err);
    }
  };


  userGoogleCallback = (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        return res.redirect(
          "http://localhost:5173/patient/login?error=authentication_failed"
        );
      }

      return res.redirect("http://localhost:5173/patient/dashboard");

    } catch (err) {
      console.error("Google User Callback Error:", err);
      return res.redirect(
        "http://localhost:5173/patient/login?error=server_error"
      );
    }
  };

  doctorGoogleCallback = (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        return res.redirect(
          "http://localhost:5173/doctor/login?error=authentication_failed"
        );
      }

      return res.redirect("http://localhost:5173/doctor/dashboard");

    } catch (err) {
      console.error("Google Doctor Callback Error:", err);
      return res.redirect(
        "http://localhost:5173/doctor/login?error=server_error"
      );
    }
  };


  logout = (req: Request, res: Response, next: NextFunction): void => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          message: MESSAGES.LOGOUT_FAILED,
        });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }

        return res.status(200).json({
          success: true,
          message: MESSAGES.LOGOUT_SUCCESS,
        });
      });
    });
  };



}

export default AuthController;

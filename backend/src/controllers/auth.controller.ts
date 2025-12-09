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
import { AppError } from "../types/error.type";
import { sendSuccess } from "../utils/response.util";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";

export class AuthController implements IAuthController {

  constructor(private _authService: IAuthService) { }


  private parseRole(role?: string): Role {
    if (!role) return Role.Patient as Role;
    const r = String(role).toLowerCase();
    if (r === Role.Patient) return Role.Patient as Role;
    if (r === Role.Doctor) return Role.Doctor as Role;
    if (r === Role.Admin) return Role.Admin as Role;
    if (r === Role.Admin) return Role.Admin as Role;
    throw new AppError(MESSAGES.INVALID_ROLE, STATUS.BAD_REQUEST);
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 //=
    });
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: RegisterDTO = req.body;
      const role = this.parseRole(dto.role as string);

      if (!dto.name || !dto.email || !dto.phone || !dto.password || !dto.confirmPassword) {
        throw new AppError(MESSAGES.MISSING_FIELDS, STATUS.BAD_REQUEST);
      }

      const result = await this._authService.register({
        ...dto,
        role,
      });

      sendSuccess(res, result, MESSAGES.OTP_SENT, STATUS.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: VerifyOtpDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      if (!dto.email || !dto.otp) {
        throw new AppError(MESSAGES.MISSING_FIELDS, STATUS.BAD_REQUEST);
      }

      const result = await this._authService.verifyOtp({ email: dto.email, otp: dto.otp, role });

      if (result.refreshToken) {
        this.setRefreshTokenCookie(res, result.refreshToken);
      
        delete result.refreshToken;
      }

      sendSuccess(res, result, MESSAGES.REGISTRATION_COMPLETE, STATUS.CREATED);
    } catch (err: unknown) {
      next(err);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const dto: ResendOtpDTO = req.body;
      if (!dto.email) {
        throw new AppError("Email is required", STATUS.BAD_REQUEST);
      }

      await this._authService.resendOtp(dto);
      sendSuccess(res, undefined, MESSAGES.OTP_RESENT, STATUS.OK);
    } catch (err: unknown) {
      return next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: LoginDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      if (!dto.email || !dto.password) {
        throw new AppError(MESSAGES.MISSING_FIELDS, STATUS.BAD_REQUEST);
      }

      const result = await this._authService.login({ email: dto.email, password: dto.password, role });

      if (result.refreshToken) {
        this.setRefreshTokenCookie(res, result.refreshToken);
        delete result.refreshToken;
      }

      sendSuccess(res, result, MESSAGES.LOGIN_SUCCESS, STATUS.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.refreshToken;

      if (!token) {
        throw new AppError("Refresh token missing", STATUS.UNAUTHORIZED);
      }

      const result = await this._authService.refreshToken(token);

      sendSuccess(res, result, "Token refreshed successfully", STATUS.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ForgotPasswordDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      if (!dto.email) {
        throw new AppError("Email is required", STATUS.BAD_REQUEST);
      }

      await this._authService.forgotPassword({ email: dto.email, role });
      sendSuccess(res, undefined, MESSAGES.PASSWORD_RESET_OTP, STATUS.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  forgotPasswordVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ForgotPasswordVerifyOtpDTO = req.body;
      if (!dto.email || !dto.otp) {
        throw new AppError(MESSAGES.MISSING_FIELDS, STATUS.BAD_REQUEST);
      }
      const result = await this._authService.forgotPasswordVerifyOtp(dto);
      sendSuccess(res, result, MESSAGES.OTP_VERIFIED, STATUS.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ResetPasswordDTO = req.body;
      if (!dto.email || !dto.resetToken || !dto.newPassword || !dto.confirmPassword) {
        throw new AppError(MESSAGES.MISSING_FIELDS, STATUS.BAD_REQUEST);
      }
      await this._authService.resetPassword(dto);
      sendSuccess(res, undefined, MESSAGES.PASSWORD_RESET_SUCCESS, STATUS.OK);
    } catch (err: unknown) {
      next(err);
    }
  };


  userGoogleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.redirect(
          "http://localhost:5173/patient/login?error=authentication_failed"
        );
      }

      const user = req.user as any;
      const token = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      this.setRefreshTokenCookie(res, refreshToken);

      let verificationStatus;
      if (user.role === "doctor") {
        verificationStatus = await this._authService.getDoctorStatus(user._id.toString());
      }

      const userData = encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        verificationStatus
      }));

      return res.redirect(`http://localhost:5173/auth/callback?token=${token}&user=${userData}`);

    } catch (err: unknown) {
      console.error("Google User Callback Error:", err);
      return res.redirect(
        "http://localhost:5173/patient/login?error=server_error"
      );
    }
  };

  doctorGoogleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.redirect(
          "http://localhost:5173/doctor/login?error=authentication_failed"
        );
      }

      const user = req.user as any;
      const token = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      this.setRefreshTokenCookie(res, refreshToken);

      const verificationStatus = await this._authService.getDoctorStatus(user._id.toString());

      const userData = encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        verificationStatus
      }));

      return res.redirect(`http://localhost:5173/auth/callback?token=${token}&user=${userData}`);

    } catch (err: unknown) {
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

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
      });

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

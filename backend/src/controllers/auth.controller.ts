import { Request, Response, NextFunction } from "express";
import {
  RegisterDTO,
  LoginDTO,
  VerifyOtpDTO,
  ResendOtpDTO,
  ForgotPasswordDTO,
  ForgotPasswordVerifyOtpDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  Role,
} from "../dtos/common.dto";
import { HttpStatus, MESSAGES, ROLES, COOKIE_OPTIONS } from "../constants/constants";
import { env } from "../configs/env";
import { IAuthService } from "../services/interfaces/IAuthService";
import { IAuthController } from "./interfaces/IAuth.controller";
import { AppError } from "../types/error.type";
import { sendSuccess, sendError } from "../utils/response.util";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";
import { ILoggerService } from "../services/interfaces/ILogger.service";
import { IUserDocument } from "../types/user.type";

export class AuthController implements IAuthController {
  constructor(
    private _authService: IAuthService,
    private logger: ILoggerService
  ) { }

  private parseRole(role?: string): Role {
    if (!role) return Role.Patient as Role;
    const r = String(role).toLowerCase();
    if (r === ROLES.PATIENT) return ROLES.PATIENT as Role;
    if (r === ROLES.DOCTOR) return ROLES.DOCTOR as Role;
    if (r === ROLES.ADMIN) return ROLES.ADMIN as Role;
    throw new AppError(MESSAGES.INVALID_ROLE, HttpStatus.BAD_REQUEST);
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    const isProduction = env.NODE_ENV === COOKIE_OPTIONS.ENV_PRODUCTION;
    res.cookie(COOKIE_OPTIONS.REFRESH_TOKEN, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? COOKIE_OPTIONS.SAME_SITE_NONE : COOKIE_OPTIONS.SAME_SITE_LAX,
      maxAge: COOKIE_OPTIONS.MAX_AGE,
      path: '/'
    });
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: RegisterDTO = req.body;
      const role = this.parseRole(dto.role as string);

      const result = await this._authService.register({
        ...dto,
        role,
      });

      sendSuccess(res, result, MESSAGES.OTP_SENT, HttpStatus.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: VerifyOtpDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      const result = await this._authService.verifyOtp({ email: dto.email, otp: dto.otp, role });

      if (result.refreshToken) {
        this.setRefreshTokenCookie(res, result.refreshToken);
        delete result.refreshToken;
      }

      sendSuccess(res, result, MESSAGES.REGISTRATION_COMPLETE, HttpStatus.CREATED);
    } catch (err: unknown) {
      next(err);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ResendOtpDTO = req.body;
      await this._authService.resendOtp(dto);
      sendSuccess(res, undefined, MESSAGES.OTP_RESENT, HttpStatus.OK);
    } catch (err: unknown) {
      return next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: LoginDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      const result = await this._authService.login({ email: dto.email, password: dto.password, role });
      if (result.refreshToken) {
        this.setRefreshTokenCookie(res, result.refreshToken);
        delete result.refreshToken;
      }

      sendSuccess(res, result, MESSAGES.LOGIN_SUCCESS, HttpStatus.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.[COOKIE_OPTIONS.REFRESH_TOKEN];

      if (!token) {
        this.logger.warn("Refresh token attempt without cookie");
        throw new AppError(MESSAGES.REFRESH_TOKEN_MISSING, HttpStatus.UNAUTHORIZED);
      }

      const result = await this._authService.refreshToken(token);

      sendSuccess(res, result, MESSAGES.TOKEN_REFRESHED, HttpStatus.OK);
    } catch (err: unknown) {
      this.logger.error("Refresh token error", err);
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ForgotPasswordDTO & { role?: string } = req.body;
      const role = this.parseRole(dto.role);

      await this._authService.forgotPassword({ email: dto.email, role });
      sendSuccess(res, undefined, MESSAGES.PASSWORD_RESET_OTP, HttpStatus.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  forgotPasswordVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ForgotPasswordVerifyOtpDTO = req.body;
      const result = await this._authService.forgotPasswordVerifyOtp(dto);
      sendSuccess(res, result, MESSAGES.OTP_VERIFIED, HttpStatus.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ResetPasswordDTO = req.body;
      await this._authService.resetPassword(dto);
      sendSuccess(res, undefined, MESSAGES.PASSWORD_RESET_SUCCESS, HttpStatus.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: ChangePasswordDTO = req.body;

      const user = req.user as any;
      const userId = user.userId || user.id || user._id;

      await this._authService.changePassword({ ...dto, userId });
      sendSuccess(res, undefined, "Password changed successfully", HttpStatus.OK);
    } catch (err: unknown) {
      next(err);
    }
  };

  userGoogleCallback = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.redirect(
          `${env.CLIENT_URL}/patient/login?error=${MESSAGES.AUTH_FAILED}`
        );
      }

      const user = req.user as unknown as IUserDocument;

      let doctorId: string | undefined;
      let verificationStatus;
      if (user.role === ROLES.DOCTOR) {
        verificationStatus = await this._authService.getDoctorStatus(user._id.toString());
        doctorId = await this._authService.getDoctorId(user._id.toString());
      }

      const token = generateAccessToken(user, doctorId);
      const refreshToken = generateRefreshToken(user, doctorId);

      this.setRefreshTokenCookie(res, refreshToken);

      const userData = encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        verificationStatus
      }));

      return res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}&user=${userData}`);

    } catch (err: unknown) {
      this.logger.error("Google user callback error", err);
      return res.redirect(
        `${env.CLIENT_URL}/patient/login?error=${MESSAGES.SERVER_ERROR_CODE}`
      );
    }
  };

  doctorGoogleCallback = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.redirect(
          `${env.CLIENT_URL}/doctor/login?error=${MESSAGES.AUTH_FAILED}`
        );
      }

      const user = req.user as unknown as IUserDocument;

      const verificationStatus = await this._authService.getDoctorStatus(user._id.toString());
      const doctorId = await this._authService.getDoctorId(user._id.toString());

      const token = generateAccessToken(user, doctorId);
      const refreshToken = generateRefreshToken(user, doctorId);

      this.setRefreshTokenCookie(res, refreshToken);

      const userData = encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        verificationStatus
      }));

      return res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}&user=${userData}`);

    } catch (err: unknown) {
      this.logger.error("Google doctor callback error", err);
      return res.redirect(
        `${env.CLIENT_URL}/doctor/login?error=${MESSAGES.SERVER_ERROR_CODE}`
      );
    }
  };

  logout = (req: Request, res: Response, _next: NextFunction): void => {
    req.logout((err) => {
      if (err) {
        this.logger.error("Logout error", err);
        return sendError(res, MESSAGES.LOGOUT_FAILED, HttpStatus.INTERNAL_ERROR);
      }

      res.clearCookie(COOKIE_OPTIONS.REFRESH_TOKEN, {
        httpOnly: true,
        secure: env.NODE_ENV === COOKIE_OPTIONS.ENV_PRODUCTION,
        sameSite: env.NODE_ENV === COOKIE_OPTIONS.ENV_PRODUCTION ? COOKIE_OPTIONS.SAME_SITE_NONE : COOKIE_OPTIONS.SAME_SITE_LAX
      });

      req.session.destroy((err) => {
        if (err) {
          this.logger.error("Session destroy error", err);
        }

        return sendSuccess(res, undefined, MESSAGES.LOGOUT_SUCCESS, HttpStatus.OK);
      });
    });
  };

}

export default AuthController;

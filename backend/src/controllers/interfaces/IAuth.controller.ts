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
} from "../../dtos/common.dto";

export interface IAuthController {
  register(
    req: Request<Record<string, never>, unknown, RegisterDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  verifyOtp(
    req: Request<Record<string, never>, unknown, VerifyOtpDTO & { role?: Role }>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  resendOtp(
    req: Request<Record<string, never>, unknown, ResendOtpDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  login(
    req: Request<Record<string, never>, unknown, LoginDTO & { role?: Role }>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  forgotPassword(
    req: Request<Record<string, never>, unknown, ForgotPasswordDTO & { role?: Role }>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  forgotPasswordVerify(
    req: Request<Record<string, never>, unknown, ForgotPasswordVerifyOtpDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  resetPassword(
    req: Request<Record<string, never>, unknown, ResetPasswordDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  userGoogleCallback(req: Request, res: Response, next: NextFunction): void;

  doctorGoogleCallback(req: Request, res: Response, next: NextFunction): void;

  logout(req: Request, res: Response, next: NextFunction): void;

  refreshToken(req: Request, res: Response, next: NextFunction): void;
}

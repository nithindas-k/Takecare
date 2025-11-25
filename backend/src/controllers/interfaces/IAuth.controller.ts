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
    req: Request<{}, any, RegisterDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  verifyOtp(
    req: Request<{}, any, VerifyOtpDTO & { role?: Role }>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  resendOtp(
    req: Request<{}, any, ResendOtpDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  login(
    req: Request<{}, any, LoginDTO & { role?: Role }>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  forgotPassword(
    req: Request<{}, any, ForgotPasswordDTO & { role?: Role }>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  forgotPasswordVerify(
    req: Request<{}, any, ForgotPasswordVerifyOtpDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  resetPassword(
    req: Request<{}, any, ResetPasswordDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void>;

  userGoogleCallback(req: Request, res: Response, next: NextFunction): void;

  doctorGoogleCallback(req: Request, res: Response, next: NextFunction): void;

  logout(req: Request, res: Response, next: NextFunction): void;
}

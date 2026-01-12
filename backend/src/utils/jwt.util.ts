import jwt from "jsonwebtoken";
import { IUserDocument } from "../types/user.type";
import { JWTPayload } from "../types/auth.type";
import { env } from "configs/env";
import { JWT_CONFIG } from "../configs/jwt";
import { AppError, UnauthorizedError } from "../errors/AppError";
import { HttpStatus, MESSAGES } from "../constants/constants";

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;


export const generateAccessToken = (user: IUserDocument, doctorId?: string): string => {
  if (!ACCESS_TOKEN_SECRET) {
    throw new AppError(MESSAGES.SERVER_ERROR, HttpStatus.INTERNAL_ERROR);
  }
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    profileImage: user.profileImage,
    ...(doctorId && { doctorId }),
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.expiresIn as any,
  });
};


export const generateRefreshToken = (user: IUserDocument, doctorId?: string): string => {
  if (!REFRESH_TOKEN_SECRET) {
    throw new AppError(MESSAGES.SERVER_ERROR, HttpStatus.INTERNAL_ERROR);
  }
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    profileImage: user.profileImage,
    ...(doctorId && { doctorId }),
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.refreshExpiresIn as any,
  });
};


export const verifyAccessToken = (token: string): JWTPayload => {
  if (!ACCESS_TOKEN_SECRET) {
    throw new AppError(MESSAGES.SERVER_ERROR, HttpStatus.INTERNAL_ERROR);
  }
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;
  } catch {
    throw new UnauthorizedError(MESSAGES.INVALID_ACCESS_TOKEN);
  }
};


export const verifyRefreshToken = (token: string): JWTPayload => {
  if (!REFRESH_TOKEN_SECRET) {
    throw new AppError(MESSAGES.SERVER_ERROR, HttpStatus.INTERNAL_ERROR);
  }
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
  } catch {
    throw new UnauthorizedError(MESSAGES.INVALID_REFRESH_TOKEN);
  }
};


export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

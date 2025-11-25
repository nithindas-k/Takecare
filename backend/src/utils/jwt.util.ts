import jwt from "jsonwebtoken";
import { IUserDocument } from "../types/user.type";
import { env } from "configs/env";

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET || "fallback-access-secret";
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET || "fallback-refresh-secret";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}


export const generateAccessToken = (user: IUserDocument): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "7d",   
  });
};


export const generateRefreshToken = (user: IUserDocument): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });
};


export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;
  } catch {
    throw new Error("Invalid or expired access token");
  }
};


export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
};


export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

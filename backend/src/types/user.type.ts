

import { Document, Types } from "mongoose";

export interface IUser {
  customId?: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: "patient" | "doctor" | "admin";
  gender?: "male" | "female" | "other" | null;
  dob?: Date | null;
  profileImage?: string | null;
  googleId?: string;
  isActive: boolean;
  favorites?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;

}

export type IUserDocument = IUser & Document<Types.ObjectId>;

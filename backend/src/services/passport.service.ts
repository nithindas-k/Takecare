import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { googleOAuthConfig } from "../configs/googleOAuth.config";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";
import { MESSAGES, ROLES } from "../constants/constants";
import { IUserDocument } from "../types/user.type";
import { Request } from "express";

export class PassportService {
  constructor(
    private _userRepository: IUserRepository,
    private _doctorRepository: IDoctorRepository
  ) { }

  public init(): void {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          ...googleOAuthConfig,
          passReqToCallback: true,
        },
        async (
          req: Request,
          accessToken: string,
          refreshToken: string,
          profile: import("passport-google-oauth20").Profile,
          done: (error: any, user?: any, info?: any) => void
        ) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error(MESSAGES.GOOGLE_PROFILE_EMAIL_MISSING));
            }

            let user = await this._userRepository.findByEmail(email);
            const state = req.query.state as string;
            const targetRole = state === ROLES.DOCTOR ? ROLES.DOCTOR : ROLES.PATIENT;

            if (!user) {
              user = await this._userRepository.create({
                name: profile.displayName || `Google ${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)}`,
                email,
                googleId: profile.id,
                profileImage: profile.photos?.[0]?.value || null,
                isActive: true,
                role: targetRole,
              });
            }

            if (user.role === ROLES.DOCTOR) {
              const existingDoctor = await this._doctorRepository.findByUserId(user._id.toString());
              if (!existingDoctor) {
                await this._doctorRepository.create({
                  userId: user._id,
                  licenseNumber: null,
                  qualifications: [],
                  specialty: null,
                  experienceYears: null,
                  VideoFees: null,
                  ChatFees: null,
                  languages: [],
                  verificationStatus: VerificationStatus.Pending,
                  verificationDocuments: [],
                  rejectionReason: null,
                  ratingAvg: 0,
                  ratingCount: 0,
                  isActive: true,
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );

    passport.serializeUser((user: any, done: (err: any, id?: string) => void) =>
      done(null, (user as IUserDocument)._id.toString())
    );

    passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
      const user = await this._userRepository.findById(id);
      done(null, user);
    });
  }
}

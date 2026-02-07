import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
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
          profile: Profile,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          done: any
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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return done(null, user as any);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passport.serializeUser((user: any, done: any) =>
      done(null, (user as IUserDocument)._id.toString())
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passport.deserializeUser(async (id: string, done: any) => {
      const user = await this._userRepository.findById(id);
      done(null, user);
    });
  }
}

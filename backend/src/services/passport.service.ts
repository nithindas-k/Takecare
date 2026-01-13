import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { googleOAuthConfig } from "../configs/googleOAuth.config";
import { UserRepository } from "../repositories/user.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";
import { MESSAGES, ROLES } from "../constants/constants";
import { IUserDocument } from "../types/user.type";
import { Request } from "express";

const userRepository = new UserRepository();
const doctorRepository = new DoctorRepository();


passport.use(
  "google",
  new GoogleStrategy(
    {
      ...googleOAuthConfig,
      passReqToCallback: true,
    },
    async (req: Request, accessToken: string, refreshToken: string, profile: import("passport-google-oauth20").Profile, done: (error: Error | null, user?: IUserDocument) => void) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error(MESSAGES.GOOGLE_PROFILE_EMAIL_MISSING));
        }

        let user = await userRepository.findByEmail(email);
        const state = req.query.state as string;
        const targetRole = state === ROLES.DOCTOR ? ROLES.DOCTOR : ROLES.PATIENT;

        if (!user) {
          user = await userRepository.create({
            name: profile.displayName || `Google ${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)}`,
            email,
            googleId: profile.id,
            profileImage: profile.photos?.[0]?.value || null,
            isActive: true,
            role: targetRole,
          });
        }


        if (user.role === ROLES.DOCTOR) {
          const existingDoctor = await doctorRepository.findByUserId(user._id.toString());
          if (!existingDoctor) {
            await doctorRepository.create({
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

passport.serializeUser((user: IUserDocument, done) => done(null, user._id.toString()));
passport.deserializeUser(async (id: string, done: (error: Error | null, user?: IUserDocument | null) => void) => {
  const user = await userRepository.findById(id);
  done(null, user);
});

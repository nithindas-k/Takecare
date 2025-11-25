import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { googleOAuthConfig } from "../configs/googleOAuth.config";
import { UserRepository } from "../repositories/user.repository";

const userRepository = new UserRepository();

passport.use(
  new GoogleStrategy(
    googleOAuthConfig,
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email in Google profile"));
        }
        let user = await userRepository.findByEmail(email);
        if (!user) {
          user = await userRepository.create({
            name: profile.displayName || "Google User",
            email,
            googleId: profile.id,
            profileImage: profile.photos?.[0]?.value || null,
            isActive: true,
            role: "patient",
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user._id));
passport.deserializeUser(async (id: string, done) => {
  const user = await userRepository.findById(id);
  done(null, user);
});

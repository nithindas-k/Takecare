import { Router } from "express";
import passport from "passport";
import AuthController from "../controllers/auth.controller";
import { UserRepository } from "repositories/user.repository";
import { AuthService } from "services/authService";
import { OTPService } from "services/otp.service";
const userRepository = new UserRepository()
const otpService = new OTPService()
const authService = new AuthService(userRepository, otpService)
const authController = new AuthController(authService)
const router = Router();


router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);


router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/patient/login",
    failureMessage: true
  }),
  authController.userGoogleCallback
);

router.get(
  "/google/doctor",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);


router.get(
  "/google/doctor/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/doctor/login",
    failureMessage: true
  }),
  authController.doctorGoogleCallback
);





router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/login", authController.login);


router.post("/forgot-password", authController.forgotPassword);
router.post("/forgot-password-verify-otp", authController.forgotPasswordVerify);
router.post("/reset-password", authController.resetPassword);


router.get("/logout", authController.logout);

export default router;

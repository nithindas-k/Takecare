import { Router } from "express";
import { env } from "../configs/env";
import passport from "passport";
import AuthController from "../controllers/auth.controller";
import { UserRepository } from "repositories/user.repository";
import { DoctorRepository } from "repositories/doctor.repository";
import { AuthService } from "services/authService";
import { OTPService } from "services/otp.service";
import { AUTH_ROUTES } from "../constants/routes.constants";
import { AuthValidator } from "../validators/auth.validator";
import { validate } from "../middlewares/validation.middleware";

import { LoggerService } from "services/logger.service";

const userRepository = new UserRepository();
const doctorRepository = new DoctorRepository();
const otpServiceLogger = new LoggerService("OTPService");
const otpService = new OTPService(otpServiceLogger);
const authServiceLogger = new LoggerService("AuthService");
const authControllerLogger = new LoggerService("AuthController");

const authService = new AuthService(userRepository, otpService, doctorRepository, authServiceLogger);
const authController = new AuthController(authService, authControllerLogger);
const router = Router();


router.get(
  AUTH_ROUTES.GOOGLE,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);


router.get(
  AUTH_ROUTES.GOOGLE_CALLBACK,
  passport.authenticate("google", {
    failureRedirect: `${env.CLIENT_URL}/patient/login`, //=
    failureMessage: true
  }),
  authController.userGoogleCallback
);


router.get(
  AUTH_ROUTES.GOOGLE_DOCTOR,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: "doctor"
  })
);







router.post(AUTH_ROUTES.REGISTER, validate(AuthValidator.validateRegisterInput), authController.register);
router.post(AUTH_ROUTES.VERIFY_OTP, validate(AuthValidator.validateVerifyOtpInput), authController.verifyOtp);
router.post(AUTH_ROUTES.RESEND_OTP, validate(AuthValidator.validateResendOtpInput), authController.resendOtp);
router.post(AUTH_ROUTES.LOGIN, validate(AuthValidator.validateLoginInput), authController.login);


router.post(AUTH_ROUTES.FORGOT_PASSWORD, validate(AuthValidator.validateForgotPasswordInput), authController.forgotPassword);
router.post(AUTH_ROUTES.FORGOT_PASSWORD_VERIFY_OTP, validate(AuthValidator.validateForgotPasswordVerifyOtpInput), authController.forgotPasswordVerify);
router.post(AUTH_ROUTES.RESET_PASSWORD, validate(AuthValidator.validateResetPasswordInput), authController.resetPassword);


router.post(AUTH_ROUTES.REFRESH_TOKEN, authController.refreshToken);

router.get(AUTH_ROUTES.LOGOUT, authController.logout);

export default router;

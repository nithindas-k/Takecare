import { validateEmail } from "../utils/validation.util";
import { ValidationError } from "../errors/AppError";
import type {
    RegisterDTO,
    LoginDTO,
    VerifyOtpDTO,
    ResendOtpDTO,
    ForgotPasswordDTO,
    ForgotPasswordVerifyOtpDTO,
    ResetPasswordDTO
} from "../dtos/common.dto";
import { MESSAGES, GENDER } from "../constants/constants";

export class AuthValidator {
    static validateRegisterInput(data: RegisterDTO): void {
        if (!validateEmail(data.email)) {
            throw new ValidationError(MESSAGES.INVALID_EMAIL_FORMAT);
        }

        if (data.phone.length < 10) {
            throw new ValidationError(MESSAGES.INVALID_PHONE_NUMBER);
        }

        if (!data.name || data.name.trim().length < 2) {
            throw new ValidationError(MESSAGES.INVALID_NAME);
        }

        if (data.gender) {
            const validGenders: string[] = Object.values(GENDER);
            if (!validGenders.includes(String(data.gender).toLowerCase())) {
                throw new ValidationError(MESSAGES.INVALID_GENDER);
            }
        }

        if (!data.password || !/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(data.password)) {
            throw new ValidationError(MESSAGES.PASSWORD_TOO_WEAK);
        }

        if (data.password !== data.confirmPassword) {
            throw new ValidationError(MESSAGES.PASSWORDS_NOT_MATCH);
        }
    }

    static validateLoginInput(data: LoginDTO): void {
        if (!validateEmail(data.email)) {
            throw new ValidationError(MESSAGES.INVALID_EMAIL_FORMAT);
        }

        if (!data.password || data.password.length < 1) {
            throw new ValidationError("Password is required");
        }
    }

    static validateVerifyOtpInput(data: VerifyOtpDTO): void {
        if (!validateEmail(data.email)) {
            throw new ValidationError(MESSAGES.INVALID_EMAIL_FORMAT);
        }
        if (!data.otp || data.otp.trim().length === 0) {
            throw new ValidationError(MESSAGES.MISSING_FIELDS);
        }
    }

    static validateResendOtpInput(data: ResendOtpDTO): void {
        if (!validateEmail(data.email)) {
            throw new ValidationError(MESSAGES.INVALID_EMAIL_FORMAT);
        }
    }

    static validateForgotPasswordInput(data: ForgotPasswordDTO): void {
        if (!validateEmail(data.email)) {
            throw new ValidationError(MESSAGES.INVALID_EMAIL_FORMAT);
        }
    }

    static validateForgotPasswordVerifyOtpInput(data: ForgotPasswordVerifyOtpDTO): void {
        if (!validateEmail(data.email)) {
            throw new ValidationError(MESSAGES.INVALID_EMAIL_FORMAT);
        }
        if (!data.otp || data.otp.trim().length === 0) {
            throw new ValidationError(MESSAGES.MISSING_FIELDS);
        }
    }

    static validateResetPasswordInput(data: ResetPasswordDTO): void {
        if (!validateEmail(data.email)) {
            throw new ValidationError(MESSAGES.INVALID_EMAIL_FORMAT);
        }
        if (!data.resetToken) {
            throw new ValidationError(MESSAGES.RESET_TOKEN_INVALID);
        }
        if (!data.newPassword || !data.confirmPassword) {
            throw new ValidationError(MESSAGES.MISSING_FIELDS);
        }
        // Strong password check
        if (!/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(data.newPassword)) {
            throw new ValidationError(MESSAGES.PASSWORD_TOO_WEAK);
        }
        if (data.newPassword !== data.confirmPassword) {
            throw new ValidationError(MESSAGES.PASSWORDS_NOT_MATCH);
        }
    }
}

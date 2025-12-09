import { validateEmail } from "../utils/validation.util";
import { ValidationError } from "../errors/AppError";
import type { RegisterDTO } from "../dtos/common.dto";

export class AuthValidator {
    static validateRegisterInput(data: RegisterDTO): void {
        if (!validateEmail(data.email)) {
            throw new ValidationError("Invalid email format");
        }

        if (data.phone.length < 10) {
            throw new ValidationError("Invalid phone number");
        }

        if (!data.name || data.name.trim().length < 2) {
            throw new ValidationError("Name must be at least 2 characters");
        }

        if (data.gender) {
            const validGenders = ["male", "female", "other"];
            if (!validGenders.includes(String(data.gender).toLowerCase())) {
                throw new ValidationError("Gender must be male, female, or other");
            }
        }
    }

    static validateLoginInput(email: string, password: string): void {
        if (!validateEmail(email)) {
            throw new ValidationError("Invalid email format");
        }

        if (!password || password.length < 1) {
            throw new ValidationError("Password is required");
        }
    }
}

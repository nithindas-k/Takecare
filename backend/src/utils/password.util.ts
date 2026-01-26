import bcrypt from "bcrypt";
import { ValidationError } from "../errors/AppError";
import { MESSAGES } from "../constants/constants";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const validatePassword = (password: string): void => {
  const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!strongPasswordRegex.test(password)) {
    throw new ValidationError(MESSAGES.PASSWORD_TOO_WEAK);
  }
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): void => {
  if (password !== confirmPassword) {
    throw new ValidationError(MESSAGES.PASSWORDS_NOT_MATCH);
  }
};

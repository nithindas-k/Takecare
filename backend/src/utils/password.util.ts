import bcrypt from "bcrypt";

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
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): void => {
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }
};

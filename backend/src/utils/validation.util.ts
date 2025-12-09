export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string, minLength: number = 10): boolean => {
  return phone.length >= minLength;
};

export const validateRequired = (value: unknown, fieldName: string): void => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`${fieldName} is required`);
  }
};

export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): void => {
  if (value.length < minLength || value.length > maxLength) {
    throw new Error(
      `${fieldName} must be between ${minLength} and ${maxLength} characters`
    );
  }
};

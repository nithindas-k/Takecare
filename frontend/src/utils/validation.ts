
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9]{10}$/;

export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone);
};

export const validatePassword = (password: string): boolean => {
  const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  return strongPasswordRegex.test(password);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

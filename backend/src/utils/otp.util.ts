export const generateOtp = (length: number = 6): string => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

export const getOtpExpiry = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const isOtpExpired = (expiresAt: Date): boolean => {
  return new Date() > new Date(expiresAt);
};

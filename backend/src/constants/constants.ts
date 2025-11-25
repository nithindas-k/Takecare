import { StatusCodes } from "http-status-codes";

export const STATUS = {
  OK: StatusCodes.OK,
  CREATED: StatusCodes.CREATED,
  BAD_REQUEST: StatusCodes.BAD_REQUEST,
  UNAUTHORIZED: StatusCodes.UNAUTHORIZED,
  FORBIDDEN: StatusCodes.FORBIDDEN,
  NOT_FOUND: StatusCodes.NOT_FOUND,
  CONFLICT: StatusCodes.CONFLICT,
  INTERNAL_ERROR: StatusCodes.INTERNAL_SERVER_ERROR,
  GONE: StatusCodes.GONE,
};

export const MESSAGES = {
  SERVER_ERROR: "Server error",
  MISSING_FIELDS: "All required fields must be provided",
  INVALID_ROLE: "Invalid role provided",
  UNAUTHORIZED: "Unauthorized",
  NOT_FOUND: "Not found",
  VERIFICATION_SUBMITTED:"success",

  INVALID_CREDENTIALS: "Invalid email or password",
  LOGIN_SUCCESS: "Login successful",
  OTP_SENT: "OTP sent to your email. Please verify to complete registration.",
  OTP_RESENT: "OTP resent to your email.",
  REGISTRATION_COMPLETE: "Registration complete!",
  PASSWORD_RESET_OTP: "OTP sent to your email for password reset.",
  OTP_VERIFIED: "OTP verified successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successful. You can now login with your new password.",
  USER_EXISTS_EMAIL: "User with this email already exists",
  USER_EXISTS_PHONE: "User with this phone number already exists",
  OTP_INVALID_OR_EXPIRED: "Invalid or expired OTP",
  NO_ACCOUNT_FOUND: "No account found with this email",
  RESET_TOKEN_INVALID: "Invalid or expired reset token",

  PASSWORDS_NOT_MATCH: "Passwords do not match",
  PASSWORD_TOO_WEAK: "Password must be at least 6 characters",
  INVALID_EMAIL_FORMAT: "Invalid email format",
  INVALID_PHONE_NUMBER: "Invalid phone number",
  INVALID_NAME: "Name must be at least 2 characters",
  INVALID_GENDER: "Gender must be male, female, or other",

  LOGOUT_SUCCESS: "Logout success",
  LOGOUT_FAILED: "Logout failed",

  DOCTOR_ONLY: "Only doctors can perform this action",
  DOCTOR_PROFILE_NOT_FOUND: "Doctor profile not found",
  DOCTOR_NOT_FOUND: "Doctor not found",
  DOCTOR_VERIFICATION_SUBMITTED: "Verification submitted successfully. Awaiting admin approval.",
  DOCTOR_VERIFICATION_PENDING: "Doctor verification is pending",
  DOCTOR_VERIFICATION_APPROVED: "Doctor verification approved",
  DOCTOR_VERIFICATION_REJECTED: "Doctor verification rejected",
  DOCTOR_VERIFICATION_REQUIRED: "Doctor verification is required to access this resource",

  DOCTOR_INVALID_DEGREE: "Please provide a valid medical degree (MBBS, MD, MS, BDS, etc.)",
  DOCTOR_INVALID_EXPERIENCE: "Invalid experience years",
  DOCTOR_INVALID_SPECIALITY: "Invalid medical speciality",
  DOCTOR_MIN_FEES: "Consultation fees seem too low. Please verify.",
  DOCTOR_MAX_FEES: "Consultation fees seem too high. Please verify.",
  DOCTOR_LICENSE_INVALID: "Invalid medical license number format",
  DOCTOR_MISSING_DOCUMENTS: "Please upload at least one verification document (degree certificate, license, etc.)",
  DOCTOR_TOO_MANY_DOCUMENTS: "Maximum 10 documents can be uploaded",
  DOCTOR_INVALID_FILE_TYPE: "Invalid file type. Only JPEG, PNG, and PDF files are allowed",
  DOCTOR_FILE_TOO_LARGE: "Uploaded file too large. Maximum allowed size is 5MB",

  AVAILABILITY_UPDATED: "Availability updated successfully",
  APPOINTMENTS_RETRIEVED: "Appointments retrieved successfully",

  ACTION_NOT_ALLOWED: "Action not allowed",
};

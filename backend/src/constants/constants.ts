import { StatusCodes } from "http-status-codes";
import { env } from "../configs/env";

export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
} as const;

export const GENDER = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;

export const COOKIE_OPTIONS = {
  REFRESH_TOKEN: "refreshToken",
  MAX_AGE: env.REFRESH_TOKEN_MAX_AGE,
  SAME_SITE_STRICT: "strict",
  SAME_SITE_NONE: "none",
  ENV_PRODUCTION: "production",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
} as const;

export const DOCTOR_PUBLIC_DEFAULTS = {
  LOCATION: "Kerala, India",
  RATING: 4.5,
  PROFILE_IMAGE: "/default-doctor.png",
  NAME: "Dr. User",
  GENDER: "Unknown",
  SPECIALTY: "General",
  ABOUT:
    "Dedicated medical professional with years of experience in providing quality healthcare services.",
} as const;

export const SCHEDULE_DEFAULTS = {
  SLOT_DURATION_MINUTES: 30,
  BUFFER_TIME_MINUTES: 5,
  MAX_PATIENTS_PER_SLOT: 1,
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  UPCOMING: "upcoming",
  RESCHEDULE_REQUESTED: "reschedule_requested",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;

export const PAYMENT_COMMISSION = {
  ADMIN_PERCENT: 20,
  DOCTOR_PERCENT: 80,
} as const;

export const CANCELLATION_RULES = {
  USER_CANCEL_REFUND_PERCENT: 70,
  USER_CANCEL_ADMIN_COMMISSION: 10,
  USER_CANCEL_DOCTOR_COMMISSION: 20,
} as const;

export const PAYMENT_DEFAULTS = {
  CURRENCY: "INR",
  PAISE_MULTIPLIER: 100,
} as const;

export const UPLOAD_DEFAULTS = {
  CLOUDINARY_FOLDER: "takecare-uploads",
  ALLOWED_FORMATS: ["jpg", "jpeg", "png", "pdf", "webm", "mp3", "wav", "ogg"],
  ALLOWED_MIMETYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "audio/webm",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "video/webm"
  ],
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
} as const;

export const ERROR_CODES = {
  USER_BLOCKED: "USER_BLOCKED",
  DOCTOR_BANNED: "DOCTOR_BANNED",
} as const;

export const CONFIG = {
  SESSION_MAX_AGE: env.SESSION_MAX_AGE,
  OTP_EXPIRY_MINUTES: 1,
  OTP_RESEND_DELAY_SECONDS: 30,
} as const;


export enum HttpStatus {
  OK = StatusCodes.OK,
  CREATED = StatusCodes.CREATED,
  BAD_REQUEST = StatusCodes.BAD_REQUEST,
  UNAUTHORIZED = StatusCodes.UNAUTHORIZED,
  FORBIDDEN = StatusCodes.FORBIDDEN,
  NOT_FOUND = StatusCodes.NOT_FOUND,
  CONFLICT = StatusCodes.CONFLICT,
  INTERNAL_ERROR = StatusCodes.INTERNAL_SERVER_ERROR,
  GONE = StatusCodes.GONE,
}

export const STATUS = {
  OK: HttpStatus.OK,
  CREATED: HttpStatus.CREATED,
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  INTERNAL_ERROR: HttpStatus.INTERNAL_ERROR,
  GONE: HttpStatus.GONE,
};

export const MESSAGES = {
  SERVER_ERROR: "Server error",
  MONGODB_URI_MISSING: "MONGODB_URI missing in .env",
  MISSING_FIELDS: "All required fields must be provided",
  INVALID_ROLE: "Invalid role provided",
  UNAUTHORIZED: "Unauthorized",
  NOT_FOUND: "Not found",
  INVALID_ID_FORMAT: "Invalid ID format",
  ROUTE_NOT_FOUND: "Route not found",
  VERIFICATION_SUBMITTED: "success",
  USER_NOT_ACTIVE: "User is not active",
  USER_NOT_FOUND: "User not found",
  USER_BLOCKED: "Your account has been blocked",
  APPOINTMENT_CANNOT_RESCHEDULE: "You can only reschedule an appointment once.",
  DOCTOR_SPECIALITY_LIMIT_EXCEEDED: "limit is 2",
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
  OTP_SESSION_EXPIRED: "Registration session expired. Please register again.",
  OTP_SESSION_EXPIRED_RESEND: "Registration session expired. Please register again to receive a new OTP.",

  EMAIL_CREDENTIALS_NOT_CONFIGURED: "Email credentials not configured. Please set SMTP_USER and SMTP_PASS in your .env file",
  EMAIL_SEND_FAILED: "Failed to send email: {error}",
  GOOGLE_PROFILE_EMAIL_MISSING: "No email in Google profile",

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
  DOCTOR_ONLY_VERIFICATION: "Only doctors can submit verification",
  DOCTOR_APPROVED_SUCCESS: "Doctor approved successfully",
  DOCTOR_REJECTED_SUCCESS: "Doctor rejected successfully",
  DOCTOR_BANNED_SUCCESS: "Doctor banned successfully",
  DOCTOR_UNBANNED_SUCCESS: "Doctor unbanned successfully",
  DOCTOR_APPLICATION_REJECTED: "Application rejected by admin",
  PATIENT_BLOCKED_SUCCESS: "Patient blocked successfully",
  PATIENT_UNBLOCKED_SUCCESS: "Patient unblocked successfully",
  PATIENT_NOT_FOUND: "Patient not found",
  PROFILE_FETCHED: "Profile fetched successfully",
  TOKEN_REFRESHED: "Token refreshed successfully",
  REFRESH_TOKEN_MISSING: "Session expired or refresh token missing",
  ACCESS_TOKEN_MISSING: "No token provided",
  INVALID_ACCESS_TOKEN: "Invalid token",
  EMAIL_REQUIRED: "Email is required",
  EMAIL_PASSWORD_REQUIRED: "Email and password are required",
  DOCTOR_ID_REQUIRED: "Doctor ID is required",
  SCHEDULE_CREATED: "Schedule created successfully",
  SCHEDULE_ALREADY_EXISTS: "Schedule already exists for this doctor. Use update instead.",
  SCHEDULE_FETCHED: "Schedule fetched successfully",
  SCHEDULE_NOT_FOUND: "Schedule not found",
  SCHEDULE_UPDATED: "Schedule updated successfully",
  SCHEDULE_UPDATE_FAILED: "Failed to update schedule",
  SCHEDULE_DELETED: "Schedule deleted successfully",
  DOCTOR_ID_OR_AUTH_REQUIRED: "Doctor ID or authentication required",
  DATE_REQUIRED: "Date is required",
  INVALID_DATE_FORMAT: "Invalid date format",
  DATE_BLOCKED: "Date blocked successfully",
  DATE_UNBLOCKED: "Date unblocked successfully",
  AVAILABLE_SLOTS_FETCHED: "Available slots fetched successfully",
  DOCTORS_FETCHED: "Doctors fetched successfully",
  DOCTOR_FETCHED: "Doctor fetched successfully",
  DOCTOR_PROFILE_NOT_AVAILABLE: "Doctor profile not available",
  AUTH_FAILED: "authentication_failed",
  SERVER_ERROR_CODE: "server_error",

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
  GOOGLE_SIGNIN_REQUIRED: "Please use Google Sign-In for this account",
  INVALID_REFRESH_TOKEN: "Invalid or expired refresh token",
  EMAIL_ALREADY_REGISTERED: "This email is already registered. Please login instead.",
  VERIFICATION_FORM_DATA_FETCHED: "Verification form data fetched successfully",
  PROFILE_UPDATED: "Profile updated successfully",


  APPOINTMENT_CREATED: "Appointment request created successfully",
  APPOINTMENT_NOT_FOUND: "Appointment not found",
  APPOINTMENT_APPROVED: "Appointment approved successfully",
  APPOINTMENT_REJECTED: "Appointment request rejected",
  APPOINTMENT_CANCELLED: "Appointment cancelled successfully",
  APPOINTMENT_COMPLETED: "Appointment completed successfully",
  APPOINTMENT_ALREADY_COMPLETED: "This appointment is already completed",
  APPOINTMENT_ALREADY_CANCELLED: "This appointment is already cancelled",
  APPOINTMENT_ALREADY_PAID: "This appointment is already paid",
  APPOINTMENT_CANNOT_CANCEL: "Cannot cancel this appointment",
  APPOINTMENT_CANNOT_MODIFY: "Cannot modify this appointment",
  APPOINTMENT_INVALID_STATUS: "Invalid appointment status",
  APPOINTMENT_SLOT_NOT_AVAILABLE: "Selected time slot is not available",
  APPOINTMENT_DATE_REQUIRED: "Appointment date is required",
  APPOINTMENT_TIME_REQUIRED: "Appointment time is required",
  APPOINTMENT_TYPE_REQUIRED: "Appointment type is required",
  APPOINTMENT_DOCTOR_REQUIRED: "Doctor ID is required",
  APPOINTMENT_PAST_DATE: "Cannot book appointment in the past",
  APPOINTMENT_NOT_PENDING: "Appointment is not in pending status",
  APPOINTMENT_NOT_CONFIRMED: "Appointment is not confirmed",
  CANCELLATION_REASON_REQUIRED: "Cancellation reason is required",
  REJECTION_REASON_REQUIRED: "Rejection reason is required",

  DOCTOR_NOT_AVAILABLE: "Doctor is not available at the moment",
  UNAUTHORIZED_ACCESS: "You are not authorized to access this resource",

  DOCTOR_FEES_NOT_SET: "Doctor has not set fees for {type} consultation",

  PAYMENT_FIELDS_MISSING: "Missing Razorpay payment fields",
  PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
  PAYMENT_VERIFIED: "Payment verified",
  PAYMENT_APPOINTMENT_ID_REQUIRED: "appointmentId is required",
  PAYMENT_AMOUNT_INVALID: "amount must be greater than 0",
  RAZORPAY_KEYS_NOT_CONFIGURED: "Razorpay keys are not configured. Missing: {missing}",
};

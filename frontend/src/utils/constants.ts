
export const API_BASE_URL: string = import.meta.env.VITE_URL || "http://localhost:5000";
export const AUTH_BASE_URL: string = import.meta.env.VITE_URL || "http://localhost:5000";


export const USER_API_ROUTES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_OTP: "/auth/verify-otp",
  VERIFY_OTP_PASSWORD: "/auth/forgot-password-verify-otp",
  RESEND_OTP: "/auth/resend-otp",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  PROFILE: "/users/profile",
} as const;

export const DOCTOR_API_ROUTES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_OTP: "/auth/verify-otp",
  VERIFY_OTP_PASSWORD: "/doctors/forgot-password-verify-otp",
  RESEND_OTP: "/auth/resend-otp",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFICATION: "/doctors/verification",
  SUBMIT_VERIFICATION: "/doctors/submit-verification",
  PROFILE: "/users/profile",
  SCHEDULE: "/doctors/schedule",
  SCHEDULE_BY_ID: (doctorId: string): string => `/doctors/schedule/${doctorId}`,
  BLOCK_DATE: (doctorId?: string): string => doctorId ? `/doctors/schedule/${doctorId}/block-date` : "/doctors/schedule/block-date",
  UNBLOCK_DATE: (doctorId?: string): string => doctorId ? `/doctors/schedule/${doctorId}/block-date` : "/doctors/schedule/block-date",
  AVAILABLE_SLOTS: (doctorId: string): string => `/doctors/schedule/${doctorId}/available-slots`,
  RELATED_DOCTORS: (doctorId: string): string => `/doctors/${doctorId}/related`,
} as const;


export const AUTH_ROUTES = {
  USER_GOOGLE_LOGIN: "/auth/google",
  USER_GOOGLE_CALLBACK: "/auth/google/callback",
  DOCTOR_GOOGLE_LOGIN: "/auth/google/doctor",
  DOCTOR_GOOGLE_CALLBACK: "/auth/google/doctor/callback",
  LOGOUT: "/auth/logout",
} as const;


export const ADMIN_API_ROUTES = {
  LOGIN: "/admin/login",
  GET_ALL_USERS: "/admin/users",
  GET_USER_BY_ID: (userId: string): string => `/admin/users/${userId}`,
  UPDATE_USER: (userId: string): string => `/admin/users/${userId}`,
  DELETE_USER: (userId: string): string => `/admin/users/${userId}`,
  BLOCK_USER: (userId: string): string => `/admin/users/${userId}/block`,
  UNBLOCK_USER: (userId: string): string => `/admin/users/${userId}/unblock`,
  GET_ALL_DOCTORS: "/admin/doctors",
  GET_DOCTOR_BY_ID: (doctorId: string): string => `/admin/doctors/${doctorId}`,
  UPDATE_DOCTOR: (doctorId: string): string => `/admin/doctors/${doctorId}`,
  DELETE_DOCTOR: (doctorId: string): string => `/admin/doctors/${doctorId}`,
  APPROVE_DOCTOR: (doctorId: string): string =>
    `/admin/doctors/${doctorId}/approve`,
  REJECT_DOCTOR: (doctorId: string): string =>
    `/admin/doctors/${doctorId}/reject`,
  GET_DOCTOR_REQUESTS: "/admin/doctor-requests",
  GET_ALL_PATIENTS: "/admin/patients",
  GET_PATIENT_BY_ID: (patientId: string): string => `/admin/patients/${patientId}`,
  BLOCK_PATIENT: (patientId: string): string => `/admin/patients/${patientId}/block`,
  UNBLOCK_PATIENT: (patientId: string): string => `/admin/patients/${patientId}/unblock`,
} as const;


export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const USER_ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ADMIN: "admin",
} as const;

export const APPOINTMENT_API_ROUTES = {
  CREATE: "/appointments",
  MY_APPOINTMENTS: "/appointments/my-appointments",
  GET_BY_ID: (id: string): string => `/appointments/${id}`,
  CANCEL: (id: string): string => `/appointments/${id}/cancel`,
  DOCTOR_REQUESTS: "/appointments/doctor/requests",
  DOCTOR_LIST: "/appointments/doctor/list",
  APPROVE: (id: string): string => `/appointments/${id}/approve`,
  REJECT: (id: string): string => `/appointments/${id}/reject`,
  COMPLETE: (id: string): string => `/appointments/${id}/complete`,
  RESCHEDULE: (id: string): string => `/appointments/${id}/reschedule`,
  ADMIN_ALL: "/appointments/admin/all",
  START_CONSULTATION: (id: string): string => `/appointments/${id}/start-consultation`,
} as const;

export const PAYMENT_API_ROUTES = {
  RAZORPAY_ORDER: "/payments/razorpay/order",
  RAZORPAY_VERIFY: "/payments/razorpay/verify",
} as const;

export const WALLET_API_ROUTES = {
  MY_WALLET: "/wallet/my-wallet",
  ADMIN_EARNINGS: "/wallet/admin/earnings-overview",
  ADMIN_TRANSACTIONS: "/wallet/admin/transactions",
} as const;

export const CHAT_API_ROUTES = {
  GET_CONVERSATIONS: "/chat/conversations",
  GET_MESSAGES: (appointmentId: string): string => `/chat/${appointmentId}`,
  SEND_MESSAGE: (appointmentId: string): string => `/chat/${appointmentId}`,
  UPLOAD_ATTACHMENT: (appointmentId: string): string => `/chat/${appointmentId}/upload`,
  EDIT_MESSAGE: (messageId: string): string => `/chat/message/${messageId}`,
  DELETE_MESSAGE: (messageId: string): string => `/chat/message/${messageId}`,
} as const;

export const REVIEW_API_ROUTES = {
  ADD: "/reviews",
  UPDATE: (reviewId: string): string => `/reviews/${reviewId}`,
  DELETE: (reviewId: string): string => `/reviews/${reviewId}`,
  GET_DOCTOR_REVIEWS: (doctorId: string): string => `/reviews/doctor/${doctorId}`,
  GET_DOCTOR_STATS: (doctorId: string): string => `/reviews/doctor/${doctorId}/stats`,
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

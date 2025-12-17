
export const BASE_ROUTES = {
    AUTH: "/auth",
    ADMIN: "/admin",
    DOCTORS: "/doctors",
    USERS: "/users",
    APPOINTMENTS: "/appointments",
    PAYMENTS: "/payments",
} as const;


export const AUTH_ROUTES = {
    GOOGLE: "/google",
    GOOGLE_CALLBACK: "/google/callback",
    GOOGLE_DOCTOR: "/google/doctor",
    REGISTER: "/register",
    VERIFY_OTP: "/verify-otp",
    RESEND_OTP: "/resend-otp",
    LOGIN: "/login",
    LOGOUT: "/logout",


    FORGOT_PASSWORD: "/forgot-password",
    FORGOT_PASSWORD_VERIFY_OTP: "/forgot-password-verify-otp",
    RESET_PASSWORD: "/reset-password",


    REFRESH_TOKEN: "/refresh-token",
} as const;

export const ADMIN_ROUTES = {
    LOGIN: "/login",


    DOCTOR_REQUESTS: "/doctor-requests",
    DOCTOR_BY_ID: "/doctors/:doctorId",
    DOCTOR_APPROVE: "/doctors/:doctorId/approve",
    DOCTOR_REJECT: "/doctors/:doctorId/reject",
    ALL_DOCTORS: "/doctors",
    DOCTOR_BAN: "/doctors/:doctorId/ban",
    DOCTOR_UNBAN: "/doctors/:doctorId/unban",


    ALL_PATIENTS: "/patients",
    PATIENT_BY_ID: "/patients/:patientId",
    PATIENT_BLOCK: "/patients/:patientId/block",
    PATIENT_UNBLOCK: "/patients/:patientId/unblock",
} as const;


export const DOCTOR_ROUTES = {
    SUBMIT_VERIFICATION: "/submit-verification",
    VERIFICATION: "/verification",
    VERIFICATION_FORM_DATA: "/verification-form-data",
    PROFILE: "/profile",
    UPDATE_PROFILE: "/profile",
    LIST_DOCTORS: "/",
    GET_DOCTOR_BY_ID: "/:id",
} as const;


export const USER_ROUTES = {
    PROFILE: "/profile",
} as const;

export const APPOINTMENT_ROUTES = {
    CREATE: "/",
    MY_APPOINTMENTS: "/my-appointments",
    GET_BY_ID: "/:id",
    CANCEL: "/:id/cancel",
    DOCTOR_REQUESTS: "/doctor/requests",
    DOCTOR_APPOINTMENTS: "/doctor/list",
    APPROVE: "/:id/approve",
    REJECT: "/:id/reject",
    COMPLETE: "/:id/complete",
    ADMIN_ALL: "/admin/all",
} as const;

export const PAYMENT_ROUTES = {
    RAZORPAY_ORDER: "/razorpay/order",
    RAZORPAY_VERIFY: "/razorpay/verify",
} as const;


export const ROUTE_PARAMS = {
    DOCTOR_ID: ":doctorId",
    PATIENT_ID: ":patientId",
    USER_ID: ":userId",
} as const;

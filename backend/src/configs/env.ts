import dotenv from "dotenv";
dotenv.config();

export const env = {

  get MONGODB_URI() {
    return process.env.MONGODB_URI || "";
  },

  get PORT() {
    return process.env.PORT || "5000";
  },

  get CLIENT_URL() {
    return "http://localhost:5173" //  process.env.CLIENT_URL
  },

  get NODE_ENV() {
    return process.env.NODE_ENV || "development";
  },
  get SMTP_HOST() {
    return process.env.SMTP_HOST || "";
  },

  get SMTP_PORT() {
    return process.env.SMTP_PORT || "";
  },

  get SMTP_USER() {
    return process.env.SMTP_USER || "";
  },

  get SMTP_PASS() {
    return process.env.SMTP_PASS || "";
  },

  get GOOGLE_CLIENT_ID() {
    return process.env.GOOGLE_CLIENT_ID || "";
  },

  get GOOGLE_CLIENT_SECRET() {
    return process.env.GOOGLE_CLIENT_SECRET || "";
  },

  get GOOGLE_CALLBACK_URL() {
    return process.env.GOOGLE_CALLBACK_URL || "";
  },

  get ACCESS_TOKEN_SECRET() {
    return process.env.ACCESS_TOKEN_SECRET || ""
  },
  get REFRESH_TOKEN_SECRET() {
    return process.env.REFRESH_TOKEN_SECRET || ""
  },

  get SESSION_SECRET() {
    return process.env.SESSION_SECRET || "";
  },

  get AWS_ACCESS_KEY_ID() {
    return process.env.AWS_ACCESS_KEY_ID || "";
  },

  get AWS_SECRET_ACCESS_KEY() {
    return process.env.AWS_SECRET_ACCESS_KEY || "";
  },

  get AWS_REGION() {
    return process.env.AWS_REGION || "ap-south-1";
  },

  get AWS_S3_BUCKET() {
    return process.env.AWS_S3_BUCKET || "";
  },

  get AWS_S3_FOLDER() {
    return process.env.AWS_S3_FOLDER || "doctor-certificates";
  },

  get CLOUDINARY_CLOUD_NAME() {
    return process.env.CLOUDINARY_CLOUD_NAME || "dtgsyivqi";
  },

  get CLOUDINARY_API_KEY() {
    return process.env.CLOUDINARY_API_KEY || "571465936119372";
  },

  get CLOUDINARY_API_SECRET() {
    return process.env.CLOUDINARY_API_SECRET || "Sgl7yYchZIpYIl83gni3H86SSwo";
  },

  get RAZORPAY_API_KEY() {
    return process.env.RAZORPAY_API_KEY || process.env.RAZORPAY_KEY_ID || "rzp_test_RrS9ZYGEKdBbng";
  },

  get RAZORPAY_API_SECRET() {
    return process.env.RAZORPAY_API_SECRET || process.env.RAZORPAY_KEY_SECRET || "bV5EhCsws3DaYkMDo7t1Fe6q";
  },

  get REFRESH_TOKEN_MAX_AGE() {
    return Number(process.env.REFRESH_TOKEN_MAX_AGE) || 30 * 24 * 60 * 60 * 1000;
  },

  get SESSION_MAX_AGE() {
    return Number(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000;
  }
};

// src/middlewares/upload.middleware.ts
import multer, { FileFilterCallback } from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Request } from "express";
import { env } from "../configs/env";

console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh" + env.CLOUDINARY_CLOUD_NAME)
// Configure Cloudinary
console.log("Cloudinary Config Debug:");
console.log("Cloud Name:", env.CLOUDINARY_CLOUD_NAME ? "Exists" : "Missing");
console.log("API Key:", env.CLOUDINARY_API_KEY ? "Exists" : "Missing");
console.log("API Secret:", env.CLOUDINARY_API_SECRET ? "Exists" : "Missing");

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "doctor-certificates", // The folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf"], // Allowed file formats
    public_id: (req: Request, file: Express.Multer.File) => {
      // Create a unique filename (optional, Cloudinary can generate one)
      const name = file.originalname.split(".")[0].replace(/\s+/g, "-");
      return `${Date.now()}-${name}`;
    },
  } as any, // Type assertion needed for some TS versions with multer-storage-cloudinary
});

// File size limit (5 MB default)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Filter files by mimetype (redundant with allowed_formats but good for extra safety)
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ALLOWED_MIMETYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG and PDF are allowed."));
  }
};

// Exported multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

// Helpers
export const uploadSingle = (fieldName = "certificate") => upload.single(fieldName);
export const uploadArray = (fieldName = "certificates", maxCount = 5) => upload.array(fieldName, maxCount);

export default upload;

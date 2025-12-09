
import multer, { FileFilterCallback } from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage, Options } from "multer-storage-cloudinary";
import { Request } from "express";
import { env } from "../configs/env";

console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh" + env.CLOUDINARY_CLOUD_NAME)

console.log("Cloudinary Config Debug:");
console.log("Cloud Name:", env.CLOUDINARY_CLOUD_NAME ? "Exists" : "Missing");
console.log("API Key:", env.CLOUDINARY_API_KEY ? "Exists" : "Missing");
console.log("API Secret:", env.CLOUDINARY_API_SECRET ? "Exists" : "Missing");

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "doctor-certificates",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    public_id: (req: Request, file: Express.Multer.File) => {
      const name = file.originalname.split(".")[0].replace(/\s+/g, "-");
      return `${Date.now()}-${name}`;
    },
  } as Options["params"],
});

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ALLOWED_MIMETYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG and PDF are allowed."));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

export const uploadSingle = (fieldName = "certificate") => upload.single(fieldName);
export const uploadArray = (fieldName = "certificates", maxCount = 5) => upload.array(fieldName, maxCount);

export default upload;

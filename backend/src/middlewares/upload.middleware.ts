
import multer, { FileFilterCallback } from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage, Options } from "multer-storage-cloudinary";
import { Request } from "express";
import { env } from "../configs/env";
import { MESSAGES, UPLOAD_DEFAULTS } from "../constants/constants";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: UPLOAD_DEFAULTS.CLOUDINARY_FOLDER,
    allowed_formats: UPLOAD_DEFAULTS.ALLOWED_FORMATS,
    resource_type: 'auto',
    public_id: (req: Request, file: Express.Multer.File) => {
      const name = file.originalname.split(".")[0].replace(/\s+/g, "-");
      return `${Date.now()}-${name}`;
    },
  } as Options["params"],
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = UPLOAD_DEFAULTS.ALLOWED_MIMETYPES as readonly string[];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(MESSAGES.DOCTOR_INVALID_FILE_TYPE));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: UPLOAD_DEFAULTS.MAX_FILE_SIZE_BYTES,
  },
});

export const uploadSingle = (fieldName = "certificate") => upload.single(fieldName);
export const uploadArray = (fieldName = "certificates", maxCount = 5) => upload.array(fieldName, maxCount);

export default upload;

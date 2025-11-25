
import { Router } from "express";
import { DoctorController } from "../controllers/doctor.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import AuthController from "../controllers/auth.controller";
import { UserRepository } from "repositories/user.repository";
import { DoctorRepository } from "repositories/doctor.repository";
import { DoctorService } from "services/doctor.service";

const router = Router();

const doctorRepository = new DoctorRepository()
const userRepository = new UserRepository()
const doctorService  = new DoctorService(doctorRepository,userRepository)

const doctorController = new DoctorController(doctorService);




router.post(
  "/submit-verification",
  authMiddleware,
  upload.array("certificates", 5),
  doctorController.submitVerification
);

router.post(
  "/verification",
  authMiddleware,
  upload.array("certificate", 1),
  doctorController.submitVerification
);


export default router;

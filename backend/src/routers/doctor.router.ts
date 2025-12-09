import { Router } from "express";
import { DoctorController } from "../controllers/doctor.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireDoctor } from "../middlewares/role.middleware";
import { upload } from "../middlewares/upload.middleware";
import { UserRepository } from "repositories/user.repository";
import { DoctorRepository } from "repositories/doctor.repository";
import { DoctorService } from "services/doctor.service";

const router = Router();

const doctorRepository = new DoctorRepository();
const userRepository = new UserRepository();
const doctorService = new DoctorService(doctorRepository, userRepository);

const doctorController = new DoctorController(doctorService);


router.post(
  "/submit-verification",
  authMiddleware,
  requireDoctor,
  upload.array("certificates", 5),
  doctorController.submitVerification
);

router.post(
  "/verification",
  authMiddleware,
  requireDoctor,
  upload.array("certificate", 1),
  doctorController.submitVerification
);

router.get(
  "/profile",
  authMiddleware,
  requireDoctor,
  doctorController.getProfile
);

export default router;

import { Router } from "express";
import { SpecialtyController } from "../controllers/specialty.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";
import { validateSpecialtyCreation, validateSpecialtyUpdate } from "../validators/specialty.validator";
import { SpecialtyRepository } from "../repositories/specialty.repository";
import { SpecialtyService } from "../services/specialty.service";

import { LoggerService } from "../services/logger.service";

const router = Router();

const specialtyRepository = new SpecialtyRepository();
const specialtyServiceLogger = new LoggerService("SpecialtyService");
const specialtyControllerLogger = new LoggerService("SpecialtyController");

const specialtyService = new SpecialtyService(specialtyRepository, specialtyServiceLogger);
const specialtyController = new SpecialtyController(specialtyService, specialtyControllerLogger);

router.use(authMiddleware);

router.get("/active", specialtyController.getActiveSpecialties);

router.use(requireAdmin);
router.get("/", specialtyController.getAllSpecialties);
router.get("/:id", specialtyController.getSpecialtyById);
router.post("/", validateSpecialtyCreation, specialtyController.createSpecialty);
router.put("/:id", validateSpecialtyUpdate, specialtyController.updateSpecialty);
router.patch("/:id/toggle", specialtyController.toggleSpecialtyStatus);
router.delete("/:id", specialtyController.deleteSpecialty);

export default router;

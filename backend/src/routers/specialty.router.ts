import { Router } from "express";
import { SpecialtyController } from "../controllers/specialty.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";
import { validateSpecialtyCreation, validateSpecialtyUpdate } from "../validators/specialty.validator";
import { SpecialtyRepository } from "../repositories/specialty.repository";
import { SpecialtyService } from "../services/specialty.service";

const router = Router();

const specialtyRepository = new SpecialtyRepository();
const specialtyService = new SpecialtyService(specialtyRepository);
const specialtyController = new SpecialtyController(specialtyService);

// Apply authentication to all routes
router.use(authMiddleware);

// GET /api/specialties/active - Get all active specialties (for dropdowns)
router.get("/active", specialtyController.getActiveSpecialties);

// Admin only routes
router.use(requireAdmin);

// GET /api/specialties - Get all specialties with pagination and search
router.get("/", specialtyController.getAllSpecialties);

// GET /api/specialties/:id - Get specialty by ID
router.get("/:id", specialtyController.getSpecialtyById);

// POST /api/specialties - Create new specialty
router.post("/", validateSpecialtyCreation, specialtyController.createSpecialty);

// PUT /api/specialties/:id - Update specialty
router.put("/:id", validateSpecialtyUpdate, specialtyController.updateSpecialty);

// PATCH /api/specialties/:id/toggle - Toggle specialty active status
router.patch("/:id/toggle", specialtyController.toggleSpecialtyStatus);

// DELETE /api/specialties/:id - Delete specialty
router.delete("/:id", specialtyController.deleteSpecialty);

export default router;

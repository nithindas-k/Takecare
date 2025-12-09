import { AdminService } from "../services/admin.service";
import { AdminController } from "../controllers/admin.controller";
import { Router } from "express";
import { AdminRepository } from "../repositories/admin.repository";
import { UserRepository } from "../repositories/user.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";


const router = Router();

const adminRepository = new AdminRepository();
const userRepository = new UserRepository();
const doctorRepository = new DoctorRepository();
const adminService = new AdminService(adminRepository, doctorRepository, userRepository);
const adminController = new AdminController(adminService);


router.post("/login", adminController.login);

router.get("/doctor-requests", authMiddleware, requireAdmin, adminController.getDoctorRequests);
router.get("/doctors/:doctorId", authMiddleware, requireAdmin, adminController.getDoctorRequestDetails);
router.post("/doctors/:doctorId/approve", authMiddleware, requireAdmin, adminController.approveDoctor);
router.post("/doctors/:doctorId/reject", authMiddleware, requireAdmin, adminController.rejectDoctor);
router.get("/doctors", authMiddleware, requireAdmin, adminController.getAllDoctors);
router.post("/doctors/:doctorId/ban", authMiddleware, requireAdmin, adminController.banDoctor);
router.post("/doctors/:doctorId/unban", authMiddleware, requireAdmin, adminController.unbanDoctor);


router.get("/patients", authMiddleware, requireAdmin, adminController.getAllPatients);
router.get("/patients/:patientId", authMiddleware, requireAdmin, adminController.getPatientById);
router.post("/patients/:patientId/block", authMiddleware, requireAdmin, adminController.blockPatient);
router.post("/patients/:patientId/unblock", authMiddleware, requireAdmin, adminController.unblockPatient);

export default router;
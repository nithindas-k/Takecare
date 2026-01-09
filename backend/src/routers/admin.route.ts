import { AdminService } from "../services/admin.service";
import { AdminController } from "../controllers/admin.controller";
import { Router } from "express";
import { AdminRepository } from "../repositories/admin.repository";
import { UserRepository } from "../repositories/user.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";
import { checkUserBlocked } from "../middlewares/check-user-blocked.middleware";
import { ADMIN_ROUTES } from "../constants/routes.constants";


const router = Router();

const adminRepository = new AdminRepository();
const userRepository = new UserRepository();
const doctorRepository = new DoctorRepository();
const appointmentRepository = new AppointmentRepository();
const adminService = new AdminService(adminRepository, doctorRepository, userRepository, appointmentRepository);
const adminController = new AdminController(adminService);


router.post(ADMIN_ROUTES.LOGIN, adminController.login);
router.get("/stats", authMiddleware, checkUserBlocked, requireAdmin, adminController.getDashboardStats);

router.get(ADMIN_ROUTES.DOCTOR_REQUESTS, authMiddleware, checkUserBlocked, requireAdmin, adminController.getDoctorRequests);
router.get(ADMIN_ROUTES.DOCTOR_BY_ID, authMiddleware, checkUserBlocked, requireAdmin, adminController.getDoctorRequestDetails);
router.post(ADMIN_ROUTES.DOCTOR_APPROVE, authMiddleware, checkUserBlocked, requireAdmin, adminController.approveDoctor);
router.post(ADMIN_ROUTES.DOCTOR_REJECT, authMiddleware, checkUserBlocked, requireAdmin, adminController.rejectDoctor);
router.get(ADMIN_ROUTES.ALL_DOCTORS, authMiddleware, checkUserBlocked, requireAdmin, adminController.getAllDoctors);
router.post(ADMIN_ROUTES.DOCTOR_BAN, authMiddleware, checkUserBlocked, requireAdmin, adminController.banDoctor);
router.post(ADMIN_ROUTES.DOCTOR_UNBAN, authMiddleware, checkUserBlocked, requireAdmin, adminController.unbanDoctor);


router.get(ADMIN_ROUTES.ALL_PATIENTS, authMiddleware, checkUserBlocked, requireAdmin, adminController.getAllPatients);
router.get(ADMIN_ROUTES.PATIENT_BY_ID, authMiddleware, checkUserBlocked, requireAdmin, adminController.getPatientById);
router.post(ADMIN_ROUTES.PATIENT_BLOCK, authMiddleware, checkUserBlocked, requireAdmin, adminController.blockPatient);
router.post(ADMIN_ROUTES.PATIENT_UNBLOCK, authMiddleware, checkUserBlocked, requireAdmin, adminController.unblockPatient);

export default router;
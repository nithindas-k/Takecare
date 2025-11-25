import { AdminService } from "../services/admin.service";
import { AdminController } from "../controllers/admin.controller";
import { Router } from "express";
import { AdminRepository } from "../repositories/admin.repository";
import { UserRepository } from "../repositories/user.repository";
import { DoctorRepository } from "../repositories/doctor.repository";


const router = Router();

const adminRepository = new AdminRepository();
const userRepository = new UserRepository();
const doctorRepository = new DoctorRepository();
const adminService = new AdminService(adminRepository, doctorRepository, userRepository);
const adminController = new AdminController(adminService);

router.post("/login", adminController.login);
router.get("/doctor-requests", adminController.getDoctorRequests);
router.get("/doctors/:doctorId", adminController.getDoctorRequestDetails);
router.post("/doctors/:doctorId/approve", adminController.approveDoctor);
router.post("/doctors/:doctorId/reject", adminController.rejectDoctor);
router.get("/doctors", adminController.getAllDoctors);
router.post("/doctors/:doctorId/ban", adminController.banDoctor);
router.post("/doctors/:doctorId/unban", adminController.unbanDoctor);

// Patient routes
router.get("/patients", adminController.getAllPatients);
router.get("/patients/:patientId", adminController.getPatientById);
router.post("/patients/:patientId/block", adminController.blockPatient);
router.post("/patients/:patientId/unblock", adminController.unblockPatient);

export default router;
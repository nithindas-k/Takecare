import { Router } from "express";
import { PrescriptionController } from "../controllers/prescription.controller";
import { PrescriptionService } from "../services/prescription.service";
import { PrescriptionRepository } from "../repositories/prescription.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { authMiddleware } from "../middlewares/auth.middleware";

const prescriptionRouter = Router();

const prescriptionRepository = new PrescriptionRepository();
const appointmentRepository = new AppointmentRepository();
const doctorRepository = new DoctorRepository();
const prescriptionService = new PrescriptionService(
    prescriptionRepository,
    appointmentRepository,
    doctorRepository
);
const prescriptionController = new PrescriptionController(prescriptionService);

prescriptionRouter.post(
    "/",
    authMiddleware,
    prescriptionController.createPrescription
);

prescriptionRouter.get(
    "/:appointmentId",
    authMiddleware,
    prescriptionController.getPrescription
);

export default prescriptionRouter;

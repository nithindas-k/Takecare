import { Router } from "express";
import { DoctorController } from "../controllers/doctor.controller";
import { ScheduleController } from "../controllers/schedule.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireDoctor } from "../middlewares/role.middleware";
import { upload } from "../middlewares/upload.middleware";
import { UserRepository } from "repositories/user.repository";
import { DoctorRepository } from "repositories/doctor.repository";
import { DoctorService } from "services/doctor.service";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { ScheduleService } from "../services/schedule.service";

import { LoggerService } from "services/logger.service";

const router = Router();

const doctorRepository = new DoctorRepository();
const userRepository = new UserRepository();
const appointmentRepository = new AppointmentRepository();
const doctorServiceLogger = new LoggerService("DoctorService");
const doctorService = new DoctorService(doctorRepository, userRepository, appointmentRepository, doctorServiceLogger);

const doctorController = new DoctorController(doctorService);


const scheduleRepository = new ScheduleRepository();
const scheduleServiceLogger = new LoggerService("ScheduleService");

const scheduleService = new ScheduleService(
  scheduleRepository,
  appointmentRepository,
  doctorRepository,
  scheduleServiceLogger
);
const scheduleController = new ScheduleController(scheduleService);


// router.post(
//   "/submit-verification",
//   authMiddleware,
//   requireDoctor,
//   upload.array("certificates", 5),
//   doctorController.submitVerification
// );

router.post(
  "/submit-verification",
  authMiddleware,
  requireDoctor,
  upload.array("certificate", 5),
  doctorController.submitVerification
);

router.get(
  "/verification",
  authMiddleware,
  requireDoctor,
  doctorController.getVerificationFormData
);


router.get(
  "/",
  doctorController.getVerifiedDoctors
);


router.get(
  "/profile",
  authMiddleware,
  requireDoctor,
  doctorController.getProfile
);

router.get(
  "/stats",
  authMiddleware,
  requireDoctor,
  doctorController.getDashboardStats
);

router.put(
  "/profile",
  authMiddleware,
  requireDoctor,
  upload.single("profileImage"),
  doctorController.updateProfile
);


router.post(
  "/schedule",
  authMiddleware,
  requireDoctor,
  scheduleController.createSchedule
);

router.get(
  "/schedule",
  authMiddleware,
  requireDoctor,
  scheduleController.getSchedule
);

router.get(
  "/schedule/:doctorId",
  scheduleController.getSchedule
);


router.put(
  "/schedule/:doctorId",
  authMiddleware,
  requireDoctor,
  scheduleController.updateSchedule
);

router.put(
  "/schedule",
  authMiddleware,
  requireDoctor,
  scheduleController.updateSchedule
);

router.post(
  "/schedule/:doctorId/block-date",
  authMiddleware,
  requireDoctor,
  scheduleController.blockDate
);

router.post(
  "/schedule/block-date",
  authMiddleware,
  requireDoctor,
  scheduleController.blockDate
);

router.delete(
  "/schedule/:doctorId/block-date",
  authMiddleware,
  requireDoctor,
  scheduleController.unblockDate
);

router.delete(
  "/schedule/block-date",
  authMiddleware,
  requireDoctor,
  scheduleController.unblockDate
);

router.get(
  "/schedule/:doctorId/available-slots",
  scheduleController.getAvailableSlots
);

router.delete(
  "/schedule/:doctorId",
  authMiddleware,
  requireDoctor,
  scheduleController.deleteSchedule
);

router.delete(
  "/schedule",
  authMiddleware,
  requireDoctor,
  scheduleController.deleteSchedule
);

router.post(
  "/schedule/recurring-slots",
  authMiddleware,
  requireDoctor,
  scheduleController.addRecurringSlots
);

router.delete(
  "/schedule/recurring-slots/:day/:slotId",
  authMiddleware,
  requireDoctor,
  scheduleController.deleteRecurringSlot
);

router.delete(
  "/schedule/recurring-slots/by-time/:startTime/:endTime",
  authMiddleware,
  requireDoctor,
  scheduleController.deleteRecurringSlotByTime
);

router.get(
  "/:id",
  doctorController.getDoctorById
);

router.get(
  "/:id/related",
  doctorController.getRelatedDocs
);

export default router;

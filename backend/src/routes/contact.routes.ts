import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { ContactService } from '../services/contact.service';

import { LoggerService } from '../services/logger.service';
import { ContactRepository } from '../repositories/contact.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { UserRepository } from '../repositories/user.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { EmailService } from '../services/email.service';

import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { checkUserBlocked } from '../middlewares/check-user-blocked.middleware';

const router = Router();
const contactServiceLogger = new LoggerService("ContactService");
const contactControllerLogger = new LoggerService("ContactController");
const emailServiceLogger = new LoggerService("EmailService");

const contactRepository = new ContactRepository();
const doctorRepository = new DoctorRepository();
const userRepository = new UserRepository();
const appointmentRepository = new AppointmentRepository();
const emailService = new EmailService(emailServiceLogger);

const contactService = new ContactService(
    contactRepository,
    doctorRepository,
    userRepository,
    appointmentRepository,
    contactServiceLogger,
    emailService
);
const contactController = new ContactController(contactService, contactControllerLogger);


router.post('/submit', contactController.submitContactForm);
router.get('/stats', contactController.getStats);

// Admin routes
router.get('/submissions', authMiddleware, checkUserBlocked, requireAdmin, contactController.getAllSubmissions);
router.post('/reply/:id', authMiddleware, checkUserBlocked, requireAdmin, contactController.replyToContact);

export default router;

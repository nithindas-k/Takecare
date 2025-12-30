import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { ChatService } from "../services/chat.service";
import { MessageRepository } from "../repositories/message.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const chatRouter = Router();

// Initialize repositories
const messageRepository = new MessageRepository();
const appointmentRepository = new AppointmentRepository();
const doctorRepository = new DoctorRepository();

// Initialize service with dependency injection
const chatService = new ChatService(
    messageRepository,
    appointmentRepository,
    doctorRepository
);

// Initialize controller
const chatController = new ChatController(chatService);

// Routes
chatRouter.get(
    "/conversations",
    authMiddleware,
    chatController.getConversations
);

chatRouter.get(
    "/:appointmentId",
    authMiddleware,
    chatController.getMessages
);

chatRouter.post(
    "/:appointmentId",
    authMiddleware,
    chatController.sendMessage
);

chatRouter.post(
    "/:appointmentId/upload",
    authMiddleware,
    upload.single("file"),
    (req: any, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        res.status(200).json({ success: true, url: req.file.path });
    }
);

export default chatRouter;
export { chatService };

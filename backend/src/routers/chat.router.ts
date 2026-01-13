import { Router, Request, Response } from "express";
import { ChatController } from "../controllers/chat.controller";
import { ChatService } from "../services/chat.service";
import { MessageRepository } from "../repositories/message.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

import { LoggerService } from "../services/logger.service";

const chatRouter = Router();


const messageRepository = new MessageRepository();
const appointmentRepository = new AppointmentRepository();
const doctorRepository = new DoctorRepository();
const chatServiceLogger = new LoggerService("ChatService");

const chatService = new ChatService(
    messageRepository,
    appointmentRepository,
    doctorRepository,
    chatServiceLogger
);


const chatController = new ChatController(chatService);


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
    (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        res.status(200).json({ success: true, url: req.file.path });
    }
);
chatRouter.patch(
    "/message/:messageId",
    authMiddleware,
    chatController.editMessage
);

chatRouter.delete(
    "/message/:messageId",
    authMiddleware,
    chatController.deleteMessage
);

export default chatRouter;
export { chatService };

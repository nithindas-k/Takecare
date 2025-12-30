import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { NotificationService } from "../services/notification.service";
import { NotificationRepository } from "../repositories/notification.repository";
import { authMiddleware } from "../middlewares/auth.middleware";

const notificationRouter = Router();
const notificationRepository = new NotificationRepository();
export const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

notificationRouter.use(authMiddleware);

notificationRouter.get("/", notificationController.getNotifications);
notificationRouter.put("/:id/read", notificationController.markAsRead);
notificationRouter.put("/read-all", notificationController.markAllAsRead);
notificationRouter.delete("/clear-all", notificationController.clearAll);
notificationRouter.delete("/:id", notificationController.deleteNotification);

export default notificationRouter;

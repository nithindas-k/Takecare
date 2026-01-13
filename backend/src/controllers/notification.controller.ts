import { Response } from "express";
import { INotificationService } from "../services/notification.service";
import { AuthenticatedRequest } from "../types/auth.type";

export class NotificationController {
    constructor(private notificationService: INotificationService) { }

    getNotifications = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const notifications = await this.notificationService.getNotifications(userId);
            res.status(200).json(notifications);
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };

    markAsRead = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            await this.notificationService.markAsRead(id);
            res.status(200).json({ message: "Notification marked as read" });
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };

    markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            await this.notificationService.markAllAsRead(userId);
            res.status(200).json({ message: "All notifications marked as read" });
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };

    clearAll = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            await this.notificationService.clearAll(userId);
            res.status(200).json({ message: "All notifications cleared" });
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };

    deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            await this.notificationService.deleteNotification(id);
            res.status(200).json({ message: "Notification deleted" });
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };
}

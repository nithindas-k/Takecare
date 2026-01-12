import { Request, Response } from "express";
import { INotificationService } from "../services/notification.service";

export class NotificationController {
    constructor(private notificationService: INotificationService) { }

    getNotifications = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            const notifications = await this.notificationService.getNotifications(userId);
            res.status(200).json(notifications);
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };

    markAsRead = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.notificationService.markAsRead(id);
            res.status(200).json({ message: "Notification marked as read" });
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };

    markAllAsRead = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            await this.notificationService.markAllAsRead(userId);
            res.status(200).json({ message: "All notifications marked as read" });
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };

    clearAll = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.userId;
            await this.notificationService.clearAll(userId);
            res.status(200).json({ message: "All notifications cleared" });
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };

    deleteNotification = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await this.notificationService.deleteNotification(id);
            res.status(200).json({ message: "Notification deleted" });
        } catch {
            res.status(500).json({ message: "Internal server error" });
        }
    };
}

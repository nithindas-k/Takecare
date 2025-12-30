import { INotificationRepository } from "../repositories/interfaces/INotification.repository";
import { socketService } from "./socket.service";

export interface INotificationService {
    notify(userId: string, data: {
        title: string;
        message: string;
        type: "success" | "error" | "warning" | "info";
        appointmentId?: string;
    }): Promise<void>;
    getNotifications(userId: string): Promise<any>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    clearAll(userId: string): Promise<void>;
    deleteNotification(id: string): Promise<void>;
}

export class NotificationService implements INotificationService {
    constructor(private _notificationRepository: INotificationRepository) { }

    async notify(userId: string, data: any) {
        const notification = await this._notificationRepository.create({
            userId,
            ...data,
            isRead: false,
        });

        socketService.notify(userId, (notification as any).toObject ? (notification as any).toObject() : notification);
    }

    async getNotifications(userId: string) {
        return await this._notificationRepository.findByUserId(userId);
    }

    async markAsRead(id: string) {
        await this._notificationRepository.updateById(id, { isRead: true });
    }

    async markAllAsRead(userId: string) {
        await this._notificationRepository.markAllAsRead(userId);
    }

    async clearAll(userId: string) {
        await this._notificationRepository.clearAll(userId);
        socketService.clearNotifications(userId);
    }

    async deleteNotification(id: string) {
        await this._notificationRepository.deleteById(id);
    }
}

import { INotificationRepository } from "./interfaces/INotification.repository";
import NotificationModel, { INotificationDocument } from "../models/notification.model";
import { BaseRepository } from "./base.repository";

export class NotificationRepository extends BaseRepository<INotificationDocument> implements INotificationRepository {
    constructor() {
        super(NotificationModel);
    }

    async findByUserId(userId: string): Promise<INotificationDocument[]> {
        return await this.model.find({ userId }).sort({ createdAt: -1 });
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.model.updateMany({ userId, isRead: false }, { isRead: true });
    }

    async clearAll(userId: string): Promise<void> {
        await this.model.deleteMany({ userId });
    }
}

import { INotificationDocument } from "../../models/notification.model";
import { IBaseRepository } from "./IBase.repository";

export interface INotificationRepository extends IBaseRepository<INotificationDocument> {
    findByUserId(userId: string): Promise<INotificationDocument[]>;
    markAllAsRead(userId: string): Promise<void>;
    clearAll(userId: string): Promise<void>;
}

export type NotificationType = "success" | "error" | "warning" | "info";

export interface INotification {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    appointmentId?: string;
    isRead: boolean;
    createdAt: Date;
}

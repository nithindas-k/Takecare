import axiosInstance from '../api/axiosInstance';
import { NOTIFICATION_API_ROUTES } from '../utils/constants';

export const notificationService = {
    getNotifications: async () => {
        const response = await axiosInstance.get(NOTIFICATION_API_ROUTES.LIST);
        return response.data;
    },
    markAsRead: async (id: string) => {
        const response = await axiosInstance.put(NOTIFICATION_API_ROUTES.MARK_READ(id));
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await axiosInstance.put(NOTIFICATION_API_ROUTES.MARK_ALL_READ);
        return response.data;
    },
    clearAll: async () => {
        const response = await axiosInstance.delete(NOTIFICATION_API_ROUTES.CLEAR_ALL);
        return response.data;
    },
    deleteNotification: async (id: string) => {
        const response = await axiosInstance.delete(NOTIFICATION_API_ROUTES.DELETE(id));
        return response.data;
    }
};

import axiosInstance from '../api/axiosInstance';

export const notificationService = {
    getNotifications: async () => {
        const response = await axiosInstance.get('/notifications');
        return response.data;
    },
    markAsRead: async (id: string) => {
        const response = await axiosInstance.put(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await axiosInstance.put('/notifications/read-all');
        return response.data;
    },
    clearAll: async () => {
        const response = await axiosInstance.delete('/notifications/clear-all');
        return response.data;
    },
    deleteNotification: async (id: string) => {
        const response = await axiosInstance.delete(`/notifications/${id}`);
        return response.data;
    }
};

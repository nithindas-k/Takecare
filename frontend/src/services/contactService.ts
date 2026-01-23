import axiosInstance from '../api/axiosInstance';
import { CONTACT_API_ROUTES } from '../utils/constants';

interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

class ContactService {
    async submitContactForm(data: ContactFormData) {
        const response = await axiosInstance.post(CONTACT_API_ROUTES.SUBMIT, data);
        return response.data;
    }

    async getStats() {
        const response = await axiosInstance.get(CONTACT_API_ROUTES.STATS);
        return response.data;
    }

    async getAllSubmissions() {
        const response = await axiosInstance.get(CONTACT_API_ROUTES.SUBMISSIONS);
        return response.data;
    }

    async replyToMessage(id: string, message: string) {
        const response = await axiosInstance.post(CONTACT_API_ROUTES.REPLY(id), { message });
        return response.data;
    }
}

export const contactService = new ContactService();

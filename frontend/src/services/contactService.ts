import axiosInstance from '../api/axiosInstance';

interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

class ContactService {
    async submitContactForm(data: ContactFormData) {
        const response = await axiosInstance.post('/contact/submit', data);
        return response.data;
    }

    async getStats() {
        const response = await axiosInstance.get('/contact/stats');
        return response.data;
    }
}

export const contactService = new ContactService();

import api from '../api/axiosInstance';

interface ChatSummary {
    observations: string[];
    diagnoses: string[];
    plan: string[];
}

export interface AdminQueryResponse {
    answer: string;
    insights: string[];
    recommendations: string[];
    alerts: string[];
    summary: string;
    dataSnapshot?: {
        totalDoctors: number;
        totalPatients: number;
        totalRevenue: number;
        totalAppointments: number;
    };
}

export const aiService = {
    checkSymptoms: async (message: string, history: any[] = []): Promise<any> => {
        const response = await api.post('/ai/analyze', { message, history });
        return response.data.data;
    },

    summarizeChat: async (messages: any[]): Promise<ChatSummary> => {
        const response = await api.post('/ai/chat-summary', { messages });
        return response.data.data;
    },

    analyzeAdminQuery: async (query: string, context?: any): Promise<AdminQueryResponse> => {
        const response = await api.post('/ai/admin-query', { query, context });
        return response.data.data;
    },
};

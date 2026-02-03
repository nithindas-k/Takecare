export interface ChatHistoryItem {
    role: 'user' | 'assistant';
    text: string;
}

export interface RecommendedDoctor {
    id: string;
    name: string;
    specialty: string;
    matchReason: string;
}

export interface AiSymptomResponse {
    reply: string;
    isEmergency: boolean;
    emergencyInstruction: string;
    questions: string[];
    specialty: string;
    recommendedDoctors: RecommendedDoctor[];
    disclaimer: string;
}

export interface AiScribeResponse {
    observations: string[];
    diagnoses: string[];
    plan: string[];
}

export interface AiAdminQueryResponse {
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

export interface IAiService {
    analyzeSymptoms(symptoms: string, history?: ChatHistoryItem[]): Promise<AiSymptomResponse>;
    summarizeChat(messages: any[]): Promise<AiScribeResponse>;
    analyzeAdminQuery(query: string, context?: any): Promise<AiAdminQueryResponse>;
}

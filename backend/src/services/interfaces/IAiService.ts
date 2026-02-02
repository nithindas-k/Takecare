export interface IAiService {
    analyzeSymptoms(symptoms: string, history?: any[]): Promise<any>;
    summarizeChat(messages: any[]): Promise<any>;
    analyzeAdminQuery(query: string, context?: any): Promise<any>;
}

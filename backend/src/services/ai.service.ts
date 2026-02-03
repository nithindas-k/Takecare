import Groq from "groq-sdk";
import { IAiService, ChatHistoryItem, AiSymptomResponse, AiScribeResponse, AiAdminQueryResponse, RecommendedDoctor } from "./interfaces/IAiService";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { WalletRepository } from "../repositories/wallet.repository";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";
import { env } from "../configs/env";
import { Types } from "mongoose";
import { DashboardStats } from "../types/appointment.type";
import { IWalletRepository, EarningStat } from "../repositories/interfaces/IWalletRepository";

export class AiService implements IAiService {
    private groq: Groq;
    private model: string = "llama-3.1-8b-instant";
    private doctorRepository: IDoctorRepository;
    private appointmentRepository?: IAppointmentRepository;
    private userRepository?: IUserRepository;
    private walletRepository?: IWalletRepository;

    constructor(
        doctorRepository: IDoctorRepository,
        appointmentRepository?: IAppointmentRepository,
        userRepository?: IUserRepository,
        walletRepository?: IWalletRepository
    ) {
        const apiKey = env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is not defined");
        }
        this.groq = new Groq({ apiKey });
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    async analyzeSymptoms(symptoms: string, history: ChatHistoryItem[] = []): Promise<AiSymptomResponse> {
        const { doctors } = await this.doctorRepository.getAllDoctors(0, 50, {
            verificationStatus: VerificationStatus.Approved,
            isActive: true
        });

        const doctorsContext = doctors.map(d => ({
            id: d._id.toString(),
            name: (d.userId as { name?: string })?.name || "Unknown",
            specialty: d.specialty,
            experience: d.experienceYears,
            about: d.about,
            rating: d.ratingAvg
        }));

        const recentHistory = history.slice(-5);
        const olderHistory = history.slice(0, -5);

        const healthContext = olderHistory
            .filter(h => h.role === 'user')
            .map(h => h.text)
            .join(". ")
            .substring(0, 500);

        const prompt = `
### SYSTEM ROLE:
You are the "TakeCare Premium AI Health Assistant". A specialized Medical Triage AI.

### USER CONTEXT:
- PREVIOUS HISTORY: ${healthContext || "None."}
- RECENT CHAT: ${JSON.stringify(recentHistory)}
- CURRENT INPUT: "${symptoms}"

### DATABASE DOCTORS:
${JSON.stringify(doctorsContext)}

### RESPONSE RULES (ULTIMATE):
1. **Language**: Respond in the EXACT same language used by the user.
2. **Emergency**: If "isEmergency" is true, the "recommendedDoctors" array MUST be empty. Safety first.
3. **No Hallucination**: If no specialist in the database matches the symptoms, do NOT recommend any. Suggest a general checkup.
4. **Disclaimers**: Always include a medical disclaimer.

### OUTPUT JSON FORMAT:
{
  "reply": "Concise empathetic response in user's language.",
  "isEmergency": boolean,
  "emergencyInstruction": "Instructions if red flags detected.",
  "questions": ["1 Focused question if needed"],
  "specialty": "Recommended medical department",
  "recommendedDoctors": [{ "id": "id", "name": "name", "matchReason": "why" }],
  "disclaimer": "AI guidance only, not a diagnosis."
}`;

        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a specialized Medical Triage AI. Focus on accuracy and language mirroring. Only output JSON."
                    },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                response_format: { type: "json_object" }
            });

            const text = chatCompletion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(text) as AiSymptomResponse;

            if (parsed.recommendedDoctors) {
                parsed.recommendedDoctors = parsed.recommendedDoctors.map((d: RecommendedDoctor) => ({
                    ...d,
                    id: d.id?.toString()
                }));
            }
            return parsed;

        } catch (error: unknown) {
            console.error("AI Service Groq Error:", error);
            return {
                reply: `I'm having trouble connecting. Please consult a General Physician.`,
                isEmergency: false,
                emergencyInstruction: "",
                questions: [],
                specialty: "General Physician",
                recommendedDoctors: [],
                disclaimer: "AI guidance only, not a diagnosis."
            };
        }
    }



    async summarizeChat(messages: { type: string, senderModel: string, content: string }[]): Promise<AiScribeResponse> {
        try {
            const chatHistory = messages
                .filter(m => m.type === 'text')
                .map(m => `${m.senderModel}: ${m.content}`)
                .join("\n");

            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an "AI Medical Scribe". Your task is to summarize consultation chats into clean, professional lists.
                        
                        Categorize into these 3 keys:
                        1. observations: Patient's symptoms and history (e.g., "Patient reports fever for 5 days").
                        2. diagnoses: Potential conditions discussed (e.g., "Possible viral infection").
                        3. plan: Recommended treatments or tests (e.g., "Blood test required").

                        RULES:
                        - Each array element must be a plain, human-readable STRING. 
                        - DO NOT include JSON-like keys (e.g., NO {"Subjective": "..."}) inside the arrays.
                        - Be concise and clinical.
                        
                        Respond ONLY in JSON: { "observations": [string], "diagnoses": [string], "plan": [string] }`
                    },
                    { role: "user", content: `Conversation:\n${chatHistory}` }
                ],
                model: this.model,
                response_format: { type: "json_object" }
            });

            const text = chatCompletion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(text);

            const cleanup = (arr: unknown[]) => arr.map(item => {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    const values = Object.values(item);
                    return values.length > 0 ? String(values[0]) : "";
                }
                return String(item);
            });

            return {
                observations: cleanup(parsed.observations || []),
                diagnoses: cleanup(parsed.diagnoses || []),
                plan: cleanup(parsed.plan || [])
            };
        } catch (error) {
            console.error("Summarize Chat Error:", error);
            return { observations: [], diagnoses: [], plan: [] };
        }
    }

    // AI Business Analyst: Analyze admin queries about platform performance
    async analyzeAdminQuery(query: string, context?: unknown): Promise<AiAdminQueryResponse> {
        try {
            // Aggregate platform data
            const platformData: {
                timestamp: string;
                query: string;
                dashboardStats?: DashboardStats;
                doctorEarnings?: EarningStat[];
                totalPatients?: number;
                totalDoctors?: number;
            } = {
                timestamp: new Date().toISOString(),
                query: query
            };

            // Get dashboard stats if appointment repository is available
            if (this.appointmentRepository) {
                const stats = await this.appointmentRepository.getAdminDashboardStats();
                platformData.dashboardStats = stats;
            }

            // Get doctor earnings data using wallet repository
            const doctorEarnings = await this.walletRepository?.getDoctorEarningsStats() || [];

            platformData.doctorEarnings = doctorEarnings;

            // Get total counts using repositories
            const [totalPatients, totalDoctors] = await Promise.all([
                this.userRepository?.countActivePatients() || Promise.resolve(0),
                this.doctorRepository.countApprovedDoctors()
            ]);
            platformData.totalPatients = totalPatients;
            platformData.totalDoctors = totalDoctors;

            // Create AI prompt
            const prompt = `
### SYSTEM ROLE:
You are the "TakeCare AI Business Analyst", an expert in healthcare platform analytics. Your goal is to provide actionable insights to platform administrators.

### PLATFORM DATA:
${JSON.stringify(platformData, null, 2)}

### ADMIN QUERY:
"${query}"

### TASK:
Analyze the platform data and answer the admin's query with:
1. Direct answer to their question
2. Key insights and trends
3. Actionable recommendations (if applicable)
4. Any anomalies or concerns (if detected)

### RESPONSE RULES:
- Be concise and data-driven
- Use specific numbers from the data
- Highlight important trends
- Provide context for the numbers
- Respond ONLY in this JSON format:
{
  "answer": "Direct answer to the query with specific data points",
  "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"],
  "alerts": ["Any concerning patterns or anomalies"],
  "summary": "One-sentence executive summary"
}`;

            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are the TakeCare AI Business Analyst, a friendly and professional healthcare platform analytics assistant. You respond conversationally like ChatGPT. For greetings (hi, hello, hey), respond warmly and mention 1-2 key platform stats. For specific questions, provide direct, data-driven answers using real numbers from the platform data. Always output valid JSON only."
                    },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                response_format: { type: "json_object" }
            });

            const text = chatCompletion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(text) as AiAdminQueryResponse;


            parsed.dataSnapshot = {
                totalDoctors: platformData.totalDoctors || 0,
                totalPatients: platformData.totalPatients || 0,
                totalRevenue: platformData.dashboardStats?.totalRevenue || 0,
                totalAppointments: platformData.dashboardStats?.totalAppointments || 0
            };

            return parsed;

        } catch (error: unknown) {
            console.error("AI Admin Query Error:", error);
            return {
                answer: "I'm having trouble analyzing the data right now. Please try again.",
                insights: [],
                recommendations: [],
                alerts: ["AI service temporarily unavailable"],
                summary: "Error processing query"
            };
        }
    }
}

import { DoctorRepository } from "../repositories/doctor.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { UserRepository } from "../repositories/user.repository";

export const aiService = new AiService(
    new DoctorRepository(),
    new AppointmentRepository(),
    new UserRepository(),
    new WalletRepository()
);
export default aiService;


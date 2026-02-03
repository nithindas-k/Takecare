import Groq from "groq-sdk";
import { IAiService } from "./interfaces/IAiService";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { WalletRepository } from "../repositories/wallet.repository";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";
import { env } from "../configs/env";
import WalletModel from "../models/wallet.model";
import DoctorModel from "../models/doctor.model";
import UserModel from "../models/user.model";
import { Types } from "mongoose";

export class AiService implements IAiService {
    private groq: Groq;
    private model: string = "llama-3.1-8b-instant";
    private doctorRepository: IDoctorRepository;
    private appointmentRepository?: IAppointmentRepository;
    private userRepository?: IUserRepository;
    private walletRepository?: WalletRepository;

    constructor(
        doctorRepository: IDoctorRepository,
        appointmentRepository?: IAppointmentRepository,
        userRepository?: IUserRepository,
        walletRepository?: WalletRepository
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

    async analyzeSymptoms(symptoms: string, history: any[] = []): Promise<any> {
        const { doctors } = await this.doctorRepository.getAllDoctors(0, 50, {
            verificationStatus: VerificationStatus.Approved,
            isActive: true
        });

        const doctorsContext = doctors.map(d => ({
            id: d._id.toString(),
            name: (d.userId as any)?.name,
            specialty: d.specialty,
            experience: d.experienceYears,
            about: d.about,
            rating: d.ratingAvg
        }));

        const prompt = `
### SYSTEM ROLE:
You are the "TakeCare Premium AI Health Assistant", a professional medical intake specialist. Your goal is to guide patients to the right care with clinical precision and safety.

### EMERGENCY TRIAGE (CRITICAL):
If the user reports "Red Flag" symptoms (e.g., chest pain, shortness of breath, sudden numbness, severe bleeding, Loss of consciousness, or suicidal thoughts), you MUST prioritize safety.

### CONTEXT:
- DATABASE DOCTORS: ${JSON.stringify(doctorsContext)}
- CONVERSATION HISTORY: ${JSON.stringify(history)}

### TASK:
1. Analyze the user's INPUT: "${symptoms}"
2. Check for emergencies first.
3. Match with REAL DOCTORS from the database ONLY.
4. If the input is vague, ask 2 focus questions about onset and severity.

### RESPONSE RULES:
- NEVER provide a final diagnosis or prescribe medicine.
- DO NOT invent doctors. Match strictly from the list provided.
- ALWAYS include a brief medical disclaimer.
- Respond ONLY in this JSON format:
{
  "reply": "Emppathetic analysis.",
  "isEmergency": boolean,
  "emergencyInstruction": "Instructions if isEmergency is true (e.g., Call 911)",
  "questions": ["Question 1", "Question 2"],
  "specialty": "Recommended department",
  "recommendedDoctors": [
    { "id": "doctorID", "name": "Name", "specialty": "Specialty", "matchReason": "Professional logic" }
  ],
  "disclaimer": "This is an AI assessment, not a medical diagnosis. Please consult a professional for emergencies."
}`;

        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a professional medical intake assistant. You only output JSON. You prioritize user safety and triage."
                    },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                response_format: { type: "json_object" }
            });

            const text = chatCompletion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(text);

            if (parsed.recommendedDoctors) {
                parsed.recommendedDoctors = parsed.recommendedDoctors.map((d: any) => ({
                    ...d,
                    id: d.id?.toString()
                }));
            }
            return parsed;

        } catch (error: any) {
            console.error("AI Service Groq Error:", error);

            return {
                reply: `I'm having trouble connecting to my full medical database. Based on your symptoms, I recommend seeing a specialists.`,
                isEmergency: false,
                specialty: "General Physician",
                recommendedDoctors: []
            };
        }
    }


    // AI Medical Scribe: Extract key clinical information from conversation
    async summarizeChat(messages: any[]): Promise<any> {
        try {
            const chatHistory = messages
                .filter(m => m.type === 'text')
                .map(m => `${m.senderModel}: ${m.content}`)
                .join("\n");

            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an "AI Medical Scribe". Your task is to extract key clinical information into a professional format.
                        Categorize findings into:
                        1. Subjective (What the patient reported: symptoms, duration, history)
                        2. Assessment (What the doctor hypothesized or discussed)
                        3. Plan (Specific treatments, tests, or follow-ups mentioned)
                        
                        Respond ONLY in JSON: { 'observations': [], 'diagnoses': [], 'plan': [] }`
                    },
                    { role: "user", content: `Conversation:\n${chatHistory}` }
                ],
                model: this.model,
                response_format: { type: "json_object" }
            });

            const text = chatCompletion.choices[0]?.message?.content || "{}";
            return JSON.parse(text);
        } catch (error) {
            console.error("Summarize Chat Error:", error);
            return { observations: [], diagnoses: [], plan: [] };
        }
    }

    // AI Business Analyst: Analyze admin queries about platform performance
    async analyzeAdminQuery(query: string, context?: any): Promise<any> {
        try {
            // Aggregate platform data
            const platformData: any = {
                timestamp: new Date().toISOString(),
                query: query
            };

            // Get dashboard stats if appointment repository is available
            if (this.appointmentRepository) {
                const stats = await this.appointmentRepository.getAdminDashboardStats();
                platformData.dashboardStats = stats;
            }

            // Get doctor earnings data
            const doctorEarnings = await WalletModel.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $match: {
                        'user.role': 'doctor'
                    }
                },
                {
                    $lookup: {
                        from: 'doctors',
                        localField: 'userId',
                        foreignField: 'userId',
                        as: 'doctorInfo'
                    }
                },
                {
                    $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true }
                },
                {
                    $project: {
                        doctorId: '$userId',
                        name: '$user.name',
                        specialty: '$doctorInfo.specialty',
                        balance: 1,
                        isActive: '$doctorInfo.isActive'
                    }
                },
                {
                    $sort: { balance: -1 }
                }
            ]);

            platformData.doctorEarnings = doctorEarnings;

            // Get total counts
            const [totalPatients, totalDoctors] = await Promise.all([
                UserModel.countDocuments({ role: 'patient', isActive: true }),
                DoctorModel.countDocuments({ verificationStatus: VerificationStatus.Approved })
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
            const parsed = JSON.parse(text);

            // Add raw data for reference
            parsed.dataSnapshot = {
                totalDoctors: platformData.totalDoctors || 0,
                totalPatients: platformData.totalPatients || 0,
                totalRevenue: platformData.dashboardStats?.totalRevenue || 0,
                totalAppointments: platformData.dashboardStats?.totalAppointments || 0
            };

            return parsed;

        } catch (error: any) {
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


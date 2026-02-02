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

        console.log(`✅ AI Service: Found ${doctorsContext.length} approved doctors in database`);
        if (doctorsContext.length > 0) {
            console.log(`📋 Sample doctors:`, doctorsContext.slice(0, 3).map(d => `${d.name} (${d.specialty})`));
        }

        const prompt = `
### SYSTEM ROLE:
You are the "TakeCare Premium AI Health Assistant", a professional medical intake specialist. Your goal is to guide patients to the right care with empathy and precision.

### CONTEXT:
- DATABASE DOCTORS: ${JSON.stringify(doctorsContext)}
- CONVERSATION HISTORY: ${JSON.stringify(history)}

### TASK:
1. Analyze the user's INPUT: "${symptoms}"
2. If the input is a greeting or too vague, acknowledge it warmly and ask 2-3 specific medical clarifying questions (e.g., duration, severity, specific location of pain).
3. If the symptoms are clear, match them with 1-2 most relevant REAL DOCTORS from the database.
4. If no specific doctor matches, suggest the general "specialty" they should look for.

### RESPONSE RULES:
- Never provide a final diagnosis or prescribe medicine.
- Be empathetic (e.g., "I'm sorry to hear you're feeling this way").
- Keep responses concise and clinical.
- Respond ONLY in this JSON format:
{
  "reply": "A brief, empathetic analysis of their situation.",
  "questions": ["Specific question 1", "Specific question 2"],
  "specialty": "The recommended medical department",
  "recommendedDoctors": [
    {
      "id": "doctorID",
      "name": "Doctor Name",
      "specialty": "Specialty",
      "matchReason": "A professional explanation of why this doctor fits these symptoms."
    }
  ]
}`;

        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a professional medical intake assistant. You only output JSON. You are helpful, empathetic, and prioritize guiding users to the correct specialist."
                    },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                response_format: { type: "json_object" }
            });

            const text = chatCompletion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(text);

            console.log(`🤖 AI Response - Recommended ${parsed.recommendedDoctors?.length || 0} doctors`);
            console.log(`🏥 Specialty: ${parsed.specialty || 'None'}`);

            if (parsed.recommendedDoctors) {
                parsed.recommendedDoctors = parsed.recommendedDoctors.map((d: any) => ({
                    ...d,
                    id: d.id?.toString()
                }));
            }
            return parsed;

        } catch (error: any) {
            console.error("AI Service Groq Error:", error);

            // Fallback logic remains the same
            const input = symptoms.toLowerCase();
            let suggestedSpecialty = "General Physician";
            if (input.includes("tooth") || input.includes("dental")) suggestedSpecialty = "Dentist";
            else if (input.includes("skin") || input.includes("rash")) suggestedSpecialty = "Dermatologist";
            else if (input.includes("heart") || input.includes("chest")) suggestedSpecialty = "Cardiologist";
            // ... (rest of simple fallback logic)

            return {
                reply: `I'm having trouble connecting to my full medical database. Based on your symptoms, I recommend seeing a specialists.`,
                specialty: suggestedSpecialty,
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
                        content: `You are an "AI Medical Scribe". Your task is to extract key clinical information from the following doctor-patient conversation.
                        Categorize findings into:
                        1. Symptoms/Observations (What the patient reported)
                        2. Potential Diagnoses (Mentioned by the doctor)
                        3. Plan/Next Steps (Advice or tests mentioned)
                        
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


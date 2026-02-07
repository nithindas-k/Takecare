

export interface CreatePrescriptionData {
    appointmentId: string;
    diagnosis: string;
    medicines: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
    }>;
    labTests?: string[];
    instructions?: string;
    followUpDate?: Date | string;
    prescriptionPdfUrl?: string;
    doctorSignature?: string | null;
}

export interface PrescriptionResponseDTO {
    id: string;
    appointmentId: string;
    appointmentCustomId: string | null;
    appointmentDate: Date | null;
    appointmentTime: string | null;
    doctor: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        profileImage: string | null;
        specialty: string;
        registrationNumber: string | null;
        videoFees: number | null;
        chatFees: number | null;
    } | null;
    patient: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        profileImage: string | null;
        age: string | number;
        gender: string;
    } | null;
    diagnosis: string;
    medicines: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
    }>;
    labTests?: string[];
    instructions?: string;
    followUpDate?: Date;
    prescriptionPdfUrl?: string;
    doctorSignature?: string | null;
    createdAt: Date;
}

export interface IPrescriptionService {
    createPrescription(
        userId: string, // Doctor's UserID
        prescriptionData: CreatePrescriptionData
    ): Promise<PrescriptionResponseDTO>;

    getPrescriptionByAppointment(
        userId: string,
        role: string,
        appointmentId: string
    ): Promise<PrescriptionResponseDTO>;
}

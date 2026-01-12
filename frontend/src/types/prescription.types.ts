
export interface Medicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

export interface PrescriptionData {
    appointmentId: string;
    patientId: string;
    diagnosis: string;
    medicines: Medicine[];
    labTests?: string[];
    notes?: string;
    followUpDate?: string;
    doctorSignature: string;
}

export interface Prescription extends PrescriptionData {
    id: string;
    _id?: string;
    appointmentCustomId?: string;
    createdAt: string;
    doctor: {
        name: string;
        profileImage?: string;
        specialty?: string;
        registrationNumber?: string;
    };
    patient: {
        name: string;
        gender?: string;
        age?: number | string;
    };
    instructions?: string;
}

export interface PrescriptionResponse {
    success: boolean;
    message?: string;
    data?: unknown;
}

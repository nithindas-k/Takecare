import { Document, Types } from "mongoose";

export interface IMedicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

export interface IPrescription {
    appointmentId: Types.ObjectId;
    doctorId: Types.ObjectId;
    patientId: Types.ObjectId;
    diagnosis: string;
    medicines: IMedicine[];
    labTests?: string[];
    instructions?: string;
    followUpDate?: Date;
    prescriptionPdfUrl?: string;
    doctorSignature?: string | null;
    isDigitalSignatureVerified: boolean;
}

export interface IPrescriptionDocument extends IPrescription, Document {
    createdAt: Date;
    updatedAt: Date;
}

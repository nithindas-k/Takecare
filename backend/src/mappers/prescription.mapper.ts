import { Types } from "mongoose";
import { PrescriptionResponseDTO } from "../services/interfaces/IPrescriptionService";
import { IMedicine } from "../types/prescription.type";

export interface IPrescriptionPopulated {
    _id: string | Types.ObjectId;
    appointmentId: {
        _id: string | Types.ObjectId;
        customId?: string;
        appointmentDate?: Date;
        appointmentTime?: string;
    } | string | Types.ObjectId;
    doctorId: {
        _id: string | Types.ObjectId;
        userId: {
            _id: string | Types.ObjectId;
            name: string;
            email: string;
            phone?: string;
            profileImage?: string;
        };
        doctorName?: string;
        specialty?: string;
        specialization?: string;
        registrationNumber?: string;
        registrationId?: string;
        VideoFees?: number;
        ChatFees?: number;
    };
    patientId: {
        _id: string | Types.ObjectId;
        name: string;
        email: string;
        phone?: string;
        profileImage?: string | null;
        age?: string | number;
        gender?: string;
    };
    diagnosis: string;
    medicines: IMedicine[];
    labTests?: string[];
    instructions?: string;
    followUpDate?: Date;
    prescriptionPdfUrl?: string;
    doctorSignature?: string | null;
    createdAt: Date;
}

export class PrescriptionMapper {
    static toResponseDTO(prescription: IPrescriptionPopulated | null): PrescriptionResponseDTO | null {
        if (!prescription) return null;


        const doctorData = prescription.doctorId;
        const doctorUser = doctorData?.userId;


        const patientData = prescription.patientId;


        const appointmentData = prescription.appointmentId;
        const isPopulatedAppt = typeof appointmentData === 'object' && appointmentData !== null && '_id' in appointmentData;
        const apptInfo = isPopulatedAppt ? (appointmentData as { _id: string | Types.ObjectId; customId?: string; appointmentDate?: Date; appointmentTime?: string }) : null;

        return {
            id: String(prescription._id),
            appointmentId: apptInfo ? String(apptInfo._id) : String(prescription.appointmentId),
            appointmentCustomId: apptInfo ? (apptInfo.customId || null) : null,
            appointmentDate: apptInfo ? (apptInfo.appointmentDate || null) : null,
            appointmentTime: apptInfo ? (apptInfo.appointmentTime || null) : null,
            doctor: doctorData ? {
                id: String(doctorData._id),
                name: doctorUser?.name || doctorData.doctorName || 'Doctor',
                email: doctorUser?.email || null,
                phone: doctorUser?.phone || null,
                profileImage: (doctorUser?.profileImage as string | null) || null,
                specialty: doctorData.specialty || doctorData.specialization || 'General Physician',
                registrationNumber: doctorData.registrationNumber || doctorData.registrationId || null,
                videoFees: doctorData.VideoFees || null,
                chatFees: doctorData.ChatFees || null
            } : null,
            patient: patientData ? {
                id: String(patientData._id),
                name: patientData.name || 'Patient',
                email: patientData.email || null,
                phone: patientData.phone || null,
                profileImage: (patientData.profileImage as string | null) || null,
                age: patientData.age || "N/A",
                gender: patientData.gender || "N/A"
            } : null,
            diagnosis: prescription.diagnosis,
            medicines: prescription.medicines,
            labTests: prescription.labTests,
            instructions: prescription.instructions,
            followUpDate: prescription.followUpDate,
            prescriptionPdfUrl: prescription.prescriptionPdfUrl,
            doctorSignature: prescription.doctorSignature,
            createdAt: prescription.createdAt
        };
    }
}

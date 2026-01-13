import { IContact } from "../../models/contact.model";

export interface ContactSubmissionData {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

export interface ContactStats {
    totalDoctors: number;
    totalPatients: number;
    totalAppointments: number;
    avgExperience: number;
}

export interface IContactService {
    createContactSubmission(data: ContactSubmissionData): Promise<IContact>;
    getStats(): Promise<ContactStats>;
    getAllSubmissions(): Promise<IContact[]>;
    replyToContact(contactId: string, replyMessage: string): Promise<IContact | null>;
}

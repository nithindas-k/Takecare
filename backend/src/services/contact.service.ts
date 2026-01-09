import { ContactModel } from '../models/contact.model';
import DoctorModel from '../models/doctor.model';
import UserModel from '../models/user.model';
import AppointmentModel from '../models/appointment.model';

interface IContactData {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

export class ContactService {
    async createContactSubmission(data: IContactData) {
        const contact = await ContactModel.create({
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            status: 'pending',
            createdAt: new Date()
        });

        return contact;
    }

    async getStats() {
        try {
            // Get total approved doctors (verificationStatus is 'approved')
            const totalDoctors = await DoctorModel.countDocuments({
                verificationStatus: 'approved',
                isActive: true
            });

            // Get total patients (users with role 'patient')
            const totalPatients = await UserModel.countDocuments({ role: 'patient' });

            // Get total completed appointments
            const totalAppointments = await AppointmentModel.countDocuments({
                status: 'completed'
            });

            // Calculate average experience from approved doctors
            const doctors = await DoctorModel.find({
                verificationStatus: 'approved',
                isActive: true
            }).select('experienceYears');

            const avgExperience = doctors.length > 0
                ? Math.round(doctors.reduce((sum: number, doc: any) => sum + (doc.experienceYears || 0), 0) / doctors.length)
                : 0;

            return {
                totalDoctors,
                totalPatients,
                totalAppointments,
                avgExperience
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }
}

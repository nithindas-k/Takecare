import { AppointmentResponseDTO } from "../dtos/appointment.dtos/appointment.dto";
import { IAppointmentPopulated } from "../types/appointment.type";

export class AppointmentMapper {
    static toResponseDTO(apt: IAppointmentPopulated | null): AppointmentResponseDTO {
        if (!apt) return null as unknown as AppointmentResponseDTO;

        const patient = apt.patientId;
        const doctor = apt.doctorId;

        const patientData = {
            id: String(patient.customId || patient._id || (patient as { id?: string }).id),
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            profileImage: patient.profileImage,
        };

        const doctorUser = doctor.userId;
        const doctorData = {
            id: String(doctor.customId || doctor._id || (doctor as { id?: string }).id),
            name: typeof doctorUser === "object" ? doctorUser.name : "Doctor",
            email: typeof doctorUser === "object" ? doctorUser.email : "",
            phone: typeof doctorUser === "object" ? doctorUser.phone : doctor.userId?.toString(),
            profileImage: (typeof doctorUser === "object" ? doctorUser.profileImage : undefined) || undefined,
            specialty: doctor.specialty,
            experienceYears: doctor.experienceYears,
        };

        return {
            id: String(apt._id),
            patient: patientData,
            doctor: doctorData,
            appointmentType: apt.appointmentType,
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.appointmentTime,
            status: apt.status,
            consultationFees: apt.consultationFees,
            reason: apt.reason || undefined,
            cancelledBy: apt.cancelledBy || undefined,
            cancellationReason: apt.cancellationReason || undefined,
            cancelledAt: apt.cancelledAt || undefined,
            rejectionReason: apt.rejectionReason || undefined,
            paymentStatus: apt.paymentStatus,
            paymentId: apt.paymentId || undefined,
            paymentMethod: apt.paymentMethod || undefined,
            sessionStartTime: apt.sessionStartTime || undefined,
            sessionEndTime: apt.sessionEndTime || undefined,
            sessionDuration: apt.sessionDuration || undefined,
            doctorNotes: Array.isArray(apt.doctorNotes) ? apt.doctorNotes[0]?.description : undefined,
            prescriptionUrl: apt.prescriptionUrl || undefined,
            createdAt: apt.createdAt!,
            updatedAt: apt.updatedAt!,
        };
    }
}

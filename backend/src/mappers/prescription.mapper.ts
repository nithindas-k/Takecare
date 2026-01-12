export class PrescriptionMapper {
    static toResponseDTO(prescription: any) {
        if (!prescription) return null;

     
        const doctorData = prescription.doctorId;
        const doctorUser = doctorData?.userId;

  
        const patientData = prescription.patientId;

   
        const appointmentData = prescription.appointmentId;

        return {
            id: prescription._id,
            appointmentId: typeof appointmentData === 'object' ? appointmentData._id : prescription.appointmentId,
            appointmentCustomId: appointmentData?.customId || null,
            appointmentDate: appointmentData?.appointmentDate || null,
            appointmentTime: appointmentData?.appointmentTime || null,
            doctor: doctorData ? {
                id: doctorData._id,
                name: doctorUser?.name || doctorData.doctorName || 'Doctor',
                email: doctorUser?.email || null,
                phone: doctorUser?.phone || null,
                profileImage: doctorUser?.profileImage || null,
                specialty: doctorData.specialty || doctorData.specialization || 'General Physician',
                registrationNumber: doctorData.registrationNumber || doctorData.registrationId || null,
                videoFees: doctorData.VideoFees || null,
                chatFees: doctorData.ChatFees || null
            } : null,
            patient: patientData ? {
                id: patientData._id,
                name: patientData.name || 'Patient',
                email: patientData.email || null,
                phone: patientData.phone || null,
                profileImage: patientData.profileImage || null,
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

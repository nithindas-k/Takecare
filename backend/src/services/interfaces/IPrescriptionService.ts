export interface IPrescriptionService {
    createPrescription(
        userId: string, // Doctor's UserID
        prescriptionData: any
    ): Promise<any>;

    getPrescriptionByAppointment(
        userId: string,
        role: string,
        appointmentId: string
    ): Promise<any>;
}

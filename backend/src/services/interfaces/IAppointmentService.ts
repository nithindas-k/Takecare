export interface IAppointmentService {


    createAppointment(
        patientId: string,
        appointmentData: {
            doctorId: string,
            appointmentDate: Date | string,
            appointmentTime: string,
            appointmentType: "video" | "chat",
            reason: string
        }
    ): Promise<any>

    getMyAppointments(userId: string, userRole: string, status?: string, page?: number, limit?: number): Promise<{ appointments: any[], total: number, page: number, limit: number, totalPages: number }>

    getAppointmentById(
        appointmentId: string,
        userId: string,
        userRole: string
    ): Promise<any>;

    cancelAppointment(
        appointmentId: string,
        userId: string,
        userRole: string,
        cancellationReason: string
    ): Promise<void>;



    // for doctor

    getDoctorAppointmentRequests(
        doctorUserId: string,
        page: number,
        limit: number
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;

    getDoctorAppointments(
        doctorUserId: string,
        status?: string,
        page?: number,
        limit?: number
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;

    approveAppointmentRequest(
        appointmentId: string,
        doctorUserId: string
    ): Promise<void>;

    rejectAppointmentRequest(
        appointmentId: string,
        doctorUserId: string,
        rejectionReason: string
    ): Promise<void>;

    completeAppointment(
        appointmentId: string,
        doctorUserId: string,
        doctorNotes?: string,
        prescriptionUrl?: string
    ): Promise<void>;

    getAllAppointments(
        status?: string,
        page?: number,
        limit?: number
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;

    

}
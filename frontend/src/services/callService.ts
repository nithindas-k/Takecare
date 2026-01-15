import axiosInstance from "../api/axiosInstance";

export interface CallSession {
    id: string;
    appointmentId: string;
    callStatus: 'INITIATING' | 'ACTIVE' | 'RECONNECTING' | 'ENDED';
    participants: {
        doctorId: string;
        patientId: string;
        doctorSocketId?: string;
        patientSocketId?: string;
    };
    startedAt: string;
    lastActiveAt: string;
    endedAt?: string;
    reconnectionAttempts: number;
    canRejoinUntil?: string;
}

export interface RejoinStatus {
    canRejoin: boolean;
    session: CallSession | null;
}

const callService = {
    /**
     * Start a new call session
     */
    startCall: async (appointmentId: string, doctorId: string, patientId: string) => {
        const response = await axiosInstance.post(`/call/${appointmentId}/start`, {
            doctorId,
            patientId
        });
        return response.data;
    },

    /**
     * End an active call session
     */
    endCall: async (sessionId: string) => {
        const response = await axiosInstance.post(`/call/session/${sessionId}/end`);
        return response.data;
    },

    /**
     * Check if user can rejoin a call
     */
    getCallStatus: async (appointmentId: string): Promise<{ data: RejoinStatus }> => {
        const response = await axiosInstance.get(`/call/${appointmentId}/status`);
        return response.data;
    },

    /**
     * Rejoin a disconnected call
     */
    rejoinCall: async (appointmentId: string) => {
        const response = await axiosInstance.post(`/call/${appointmentId}/rejoin`);
        return response.data;
    },

    /**
     * Get active call for an appointment
     */
    getActiveCall: async (appointmentId: string): Promise<{ data: CallSession | null }> => {
        const response = await axiosInstance.get(`/call/${appointmentId}/active`);
        return response.data;
    }
};

export default callService;

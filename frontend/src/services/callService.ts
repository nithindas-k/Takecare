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
  
    startCall: async (appointmentId: string, doctorId: string, patientId: string) => {
        const response = await axiosInstance.post(`/call/${appointmentId}/start`, {
            doctorId,
            patientId
        });
        return response.data;
    },

    
    endCall: async (sessionId: string) => {
        const response = await axiosInstance.post(`/call/session/${sessionId}/end`);
        return response.data;
    },

    
    getCallStatus: async (appointmentId: string): Promise<{ data: RejoinStatus }> => {
        const response = await axiosInstance.get(`/call/${appointmentId}/status`);
        return response.data;
    },

    
    rejoinCall: async (appointmentId: string) => {
        const response = await axiosInstance.post(`/call/${appointmentId}/rejoin`);
        return response.data;
    },

  
    getActiveCall: async (appointmentId: string): Promise<{ data: CallSession | null }> => {
        const response = await axiosInstance.get(`/call/${appointmentId}/active`);
        return response.data;
    }
};

export default callService;

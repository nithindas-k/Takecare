export interface RecurringSlotsDTO {
    startTime: string;
    endTime: string;
    days: string[];
    skipOverlappingDays?: boolean;
}

export interface RecurringSlotsResponseDTO {
    success: boolean;
    overlappingDays: string[];
    nonOverlappingDays: string[];
    message?: string;
}

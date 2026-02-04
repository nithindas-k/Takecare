import { TIME_FORMAT } from "../constants/constants";

export const parseAppointmentTime = (timeString: string): string => {
    const [startTime] = timeString.split(TIME_FORMAT.DELIMITER).map(t => t.trim());
    return startTime;
};


export const parseAppointmentTimeRange = (timeString: string): { startTime: string; endTime: string } => {
    const [startTime, endTime] = timeString.split(TIME_FORMAT.DELIMITER).map(t => t.trim());
    return { startTime, endTime };
};

export const isValidAppointmentTimeFormat = (timeString: string): boolean => {
    return TIME_FORMAT.REGEX.test(timeString);
};

import { isAxiosError } from "axios";

export const handleApiError = (error: unknown, defaultMessage: string) => {
    if (isAxiosError(error)) {
        return {
            success: false,
            message: error.response?.data?.message || defaultMessage,
            status: error.response?.status,
        };
    }
    return {
        success: false,
        message: error instanceof Error ? error.message : defaultMessage,
    };
};

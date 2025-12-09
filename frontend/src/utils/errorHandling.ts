export interface ApiError {
    message: string;
    status?: number;
    data?: unknown;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return 'An unknown error occurred';
}

export function createApiError(error: unknown): ApiError {
    const message = getErrorMessage(error);

    if (error && typeof error === 'object') {
        return {
            message,
            status: 'status' in error ? Number(error.status) : undefined,
            data: 'data' in error ? error.data : undefined,
        };
    }

    return { message };
}

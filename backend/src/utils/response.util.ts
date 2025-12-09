import { Response } from "express";
import { ApiResponse } from "../types/response.type";
import { PaginatedResponse } from "../types/common";

export const sendSuccess = <T = any>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
): void => {
    const response: ApiResponse<T> = {
        success: true,
    };

    if (message) {
        response.message = message;
    }

    if (data !== undefined) {
        response.data = data;
    }

    res.status(statusCode).json(response);
};


export const sendError = (
    res: Response,
    message: string,
    statusCode: number = 500
): void => {
    res.status(statusCode).json({
        success: false,
        message,
    });
};


export const sendPaginatedResponse = <T = any>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
    statusCode: number = 200
): void => {
    const response: PaginatedResponse<T> = {
        success: true,
        data: {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };

    res.status(statusCode).json(response);
};

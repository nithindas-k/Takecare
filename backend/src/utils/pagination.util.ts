import { PaginationMeta, PaginatedResult } from "../types/pagination.type";


export const calculatePagination = (
    page: number = 1,
    limit: number = 10
): PaginationMeta => {
    const skip = (page - 1) * limit;
    return { skip, page, limit };
};

export const buildPaginatedResponse = <T>(
    items: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResult<T> => {
    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

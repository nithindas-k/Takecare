/**
 * Generic repository interface for status toggle operations
 */
export interface StatusToggleRepository {
    updateById(id: string, update: { isActive: boolean }): Promise<any>;
}

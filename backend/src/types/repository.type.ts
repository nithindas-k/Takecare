
export interface StatusToggleRepository {
    updateById(id: string, update: { isActive: boolean }): Promise<any>;
}

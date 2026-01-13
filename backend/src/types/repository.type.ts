import { Document } from "mongoose";

export interface StatusToggleRepository {
    updateById(id: string, update: { isActive: boolean }): Promise<Document | null>;
}

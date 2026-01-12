import { ILoggerService } from "../services/interfaces/ILogger.service";
import { StatusToggleRepository } from "../types/repository.type";

export const toggleEntityStatus = async (
    repository: StatusToggleRepository,
    entityId: string,
    isActive: boolean,
    entityName: string,
    logger?: ILoggerService
): Promise<void> => {
    const action = isActive ? "Activating" : "Deactivating";
    const actionPast = isActive ? "activated" : "deactivated";

    if (logger) {
        logger.info(`${action} ${entityName}`, { entityId, isActive });
    }

    await repository.updateById(entityId, { isActive });

    if (logger) {
        logger.info(`${entityName} ${actionPast} successfully`, { entityId });
    }
};

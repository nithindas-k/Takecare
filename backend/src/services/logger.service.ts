import type { ILoggerService } from "./interfaces/ILogger.service";

export class LoggerService implements ILoggerService {
    private readonly context: string;

    constructor(context: string = "Application") {
        this.context = context;
    }

    info(message: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [INFO] [${this.context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [WARN] [${this.context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
    }

    error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] [${this.context}] ${message}`);

        if (error instanceof Error) {
            console.error(`Stack: ${error.stack}`);
        } else if (error) {
            console.error(`Error details:`, error);
        }

        if (meta) {
            console.error(`Meta:`, JSON.stringify(meta, null, 2));
        }
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        if (process.env.NODE_ENV === "development") {
            const timestamp = new Date().toISOString();
            console.debug(`[${timestamp}] [DEBUG] [${this.context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
        }
    }
}

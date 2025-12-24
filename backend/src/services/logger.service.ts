import fs from "fs";
import path from "path";
import type { ILoggerService } from "./interfaces/ILogger.service";

export class LoggerService implements ILoggerService {
    private readonly context: string;
    private readonly logsDir: string;
    private readonly logFile: string;
    private readonly errorFile: string;

    constructor(context: string = "Application") {
        this.context = context;
        this.logsDir = path.join(process.cwd(), "logs");
        this.logFile = path.join(this.logsDir, "app.log");
        this.errorFile = path.join(this.logsDir, "error.log");
        this.ensureLogsDir();
    }

    private ensureLogsDir(): void {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    private writeToFile(level: string, message: string, meta?: Record<string, unknown> | unknown): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] [${this.context}] ${message} ${meta ? JSON.stringify(meta) : ""}\n`;

        fs.appendFile(this.logFile, logEntry, (err) => {
            if (err) console.error("Failed to write to app.log", err);
        });

        if (level === "ERROR") {
            fs.appendFile(this.errorFile, logEntry, (err) => {
                if (err) console.error("Failed to write to error.log", err);
            });
        }
    }

    info(message: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [INFO] [${this.context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
        this.writeToFile("INFO", message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [WARN] [${this.context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
        this.writeToFile("WARN", message, meta);
    }

    error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] [${this.context}] ${message}`);

        let errorDetails = "";
        if (error instanceof Error) {
            console.error(`Stack: ${error.stack}`);
            errorDetails = `Stack: ${error.stack}`;
        } else if (error) {
            console.error(`Error details:`, error);
            errorDetails = `Error: ${JSON.stringify(error)}`;
        }

        if (meta) {
            console.error(`Meta:`, JSON.stringify(meta, null, 2));
        }

        this.writeToFile("ERROR", `${message} ${errorDetails}`, meta);
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        if (process.env.NODE_ENV === "development") {
            console.debug(`[${timestamp}] [DEBUG] [${this.context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
        }
        this.writeToFile("DEBUG", message, meta);
    }
}

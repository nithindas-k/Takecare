
import fs from "fs";
import path from "path";
import type { ILoggerService } from "./interfaces/ILogger.service";

export class LoggerService implements ILoggerService {
    private readonly _context: string;
    private readonly _logsDir: string;
    private readonly _logFile: string;
    private readonly _errorFile: string;

    constructor(context: string = "Application") {
        this._context = context;
        this._logsDir = path.join(process.cwd(), "logs");
        this._logFile = path.join(this._logsDir, "app.log");
        this._errorFile = path.join(this._logsDir, "error.log");
        this._ensureLogsDir();
    }

    private _ensureLogsDir(): void {
        if (!fs.existsSync(this._logsDir)) {
            fs.mkdirSync(this._logsDir, { recursive: true });
        }
    }

    private _writeToFile(level: string, message: string, meta?: Record<string, unknown> | unknown): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] [${this._context}] ${message} ${meta ? JSON.stringify(meta) : ""}\n`;

        fs.appendFile(this._logFile, logEntry, (err) => {
            if (err) console.error("Failed to write to app.log", err);
        });

        if (level === "ERROR") {
            fs.appendFile(this._errorFile, logEntry, (err) => {
                if (err) console.error("Failed to write to error.log", err);
            });
        }
    }

    info(message: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [INFO] [${this._context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
        this._writeToFile("INFO", message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [WARN] [${this._context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
        this._writeToFile("WARN", message, meta);
    }

    error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] [${this._context}] ${message}`);

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

        this._writeToFile("ERROR", `${message} ${errorDetails}`, meta);
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        if (process.env.NODE_ENV === "development") {
            console.debug(`[${timestamp}] [DEBUG] [${this._context}] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
        }
        this._writeToFile("DEBUG", message, meta);
    }
}

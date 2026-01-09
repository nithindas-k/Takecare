import mongoose, { ClientSession } from "mongoose";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/constants";

/**
 * Executes a callback within a MongoDB transaction.
 * If the MongoDB instance does not support transactions (e.g., standalone),
 * it falls back to executing the callback without a transaction.
 * 
 * @param callback The function to execute. Receives a session (or undefined).
 * @returns The result of the callback.
 */
export const runInTransaction = async <T>(
    callback: (session: ClientSession | undefined) => Promise<T>
): Promise<T> => {
    const session = await mongoose.startSession();
    let transactionStarted = false;

    try {
        session.startTransaction();
        transactionStarted = true;

        const result = await callback(session);

        await session.commitTransaction();
        return result;
    } catch (error: any) {
        if (transactionStarted) {
            await session.abortTransaction();
        }

        // Check if the error is due to lack of Replica Set support (standalone instance)
        if (
            error.message &&
            (error.message.includes("Transaction numbers are only allowed on a replica set member") ||
                error.code === 20 ||
                error.codeName === "IllegalOperation")
        ) {
            console.warn("MongoDB Transaction failed (likely standalone instance). Retrying without transaction.");
            // Retry the operation without a session
            return await callback(undefined);
        }

        throw error;
    } finally {
        session.endSession();
    }
};

import mongoose, { ClientSession } from "mongoose";



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
    } catch (error: unknown) {
        if (transactionStarted) {
            await session.abortTransaction();
        }

        const err = error as { message?: string; code?: number; codeName?: string };
        if (
            err.message &&
            (err.message.includes("Transaction numbers are only allowed on a replica set member") ||
                err.code === 20 ||
                err.codeName === "IllegalOperation")
        ) {
            // eslint-disable-next-line no-console
            console.warn("MongoDB Transaction failed (likely standalone instance). Retrying without transaction.");

            return await callback(undefined);
        }

        throw error;
    } finally {
        session.endSession();
    }
};

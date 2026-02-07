import { Request, Response } from "express";

export class TimeController {
    getServerTime = async (req: Request, res: Response) => {
        try {
            const serverTime = new Date();

            res.status(200).json({
                success: true,
                data: {
                    serverTime: serverTime.toISOString(),
                    timestamp: serverTime.getTime(),
                    timezone: 'Asia/Kolkata'
                }
            });
        } catch {
            res.status(500).json({
                success: false,
                message: 'Failed to get server time'
            });
        }
    };
}

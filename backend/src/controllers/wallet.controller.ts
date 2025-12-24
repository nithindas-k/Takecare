import { Request, Response, NextFunction } from "express";
import { IWalletService } from "../services/interfaces/IWalletService";
import { HttpStatus, MESSAGES, PAGINATION } from "../constants/constants";
import { LoggerService } from "../services/logger.service";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../errors/AppError";

export class WalletController {
    private logger: LoggerService;

    constructor(private _walletService: IWalletService) {
        this.logger = new LoggerService("WalletController");
    }

    getWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const balance = await this._walletService.getWalletBalance(userId);
            const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
            const { transactions, total } = await this._walletService.getTransactions(userId, page, limit);

            sendSuccess(res, {
                balance,
                transactions,
                total,
                page,
                limit
            });
        } catch (error: any) {
            next(error);
        }
    }

    getAdminEarningsOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const overview = await this._walletService.getAdminEarningsOverview();
            sendSuccess(res, overview);
        } catch (error: any) {
            next(error);
        }
    }

    getAdminTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
            const skip = (page - 1) * limit;
            const { transactions, total } = await this._walletService.getAdminTransactions(skip, limit);
            sendSuccess(res, { transactions, total, page, limit });
        } catch (error: any) {
            next(error);
        }
    }
}

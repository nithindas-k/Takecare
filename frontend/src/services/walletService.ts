import axiosInstance from "../api/axiosInstance";
import { WALLET_API_ROUTES } from "../utils/constants";

export const walletService = {
    getMyWallet: async (page = 1, limit = 10) => {
        const response = await axiosInstance.get(WALLET_API_ROUTES.MY_WALLET, {
            params: { page, limit }
        });
        return response.data;
    },

    getAdminOverview: async () => {
        const response = await axiosInstance.get(WALLET_API_ROUTES.ADMIN_EARNINGS);
        return response.data;
    },

    getAdminTransactions: async (page = 1, limit = 10) => {
        const response = await axiosInstance.get(WALLET_API_ROUTES.ADMIN_TRANSACTIONS, {
            params: { page, limit }
        });
        return response.data;
    }
};

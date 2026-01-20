
import axiosInstance from "../api/axiosInstance";
import { WALLET_API_ROUTES } from "../utils/constants";

export const walletService = {
    getMyWallet: async (page = 1, limit = 10, search?: string, type?: string, date?: string) => {
        const params: any = { page, limit };
        if (search) params.search = search;
        if (type && type !== 'all') params.type = type;
        if (date) params.date = date;

        const response = await axiosInstance.get(WALLET_API_ROUTES.MY_WALLET, {
            params
        });
        return response.data;
    },

    getAdminOverview: async () => {
        const response = await axiosInstance.get(WALLET_API_ROUTES.ADMIN_EARNINGS);
        return response.data;
    },

    getAdminTransactions: async (page = 1, limit = 10, date?: string) => {
        const params: any = { page, limit };
        if (date) params.date = date;

        const response = await axiosInstance.get(WALLET_API_ROUTES.ADMIN_TRANSACTIONS, {
            params
        });
        return response.data;
    }
};


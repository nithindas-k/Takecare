import axiosInstance from "../api/axiosInstance";
import { PAYMENT_API_ROUTES } from "../utils/constants";

export const paymentService = {
  createRazorpayOrder: async (payload: { appointmentId: string; amount: number; currency?: string }) => {
    const response = await axiosInstance.post(PAYMENT_API_ROUTES.RAZORPAY_ORDER, payload);
    return response.data;
  },

  verifyRazorpayPayment: async (payload: {
    appointmentId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await axiosInstance.post(PAYMENT_API_ROUTES.RAZORPAY_VERIFY, payload);
    return response.data;
  },
};

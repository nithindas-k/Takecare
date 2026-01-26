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

  unlockSlot: async (appointmentId: string) => {
    try {
      if (!appointmentId) return;
      await axiosInstance.post(PAYMENT_API_ROUTES.UNLOCK_SLOT, { appointmentId });
    } catch (error) {
      console.error("Failed to unlock slot", error);
    }
  },
};

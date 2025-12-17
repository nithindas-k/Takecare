export interface CreateRazorpayOrderDTO {
    appointmentId: string;
    amount: number;
    currency?: string;
}

export interface VerifyRazorpayPaymentDTO {
    appointmentId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

import { CreateRazorpayOrderDTO, VerifyRazorpayPaymentDTO } from "../../dtos/payment.dtos/razorpay.dto";

export interface IPaymentService {
    createRazorpayOrder(
        patientId: string,
        dto: CreateRazorpayOrderDTO
    ): Promise<{ keyId: string; orderId: string; amount: number; currency: string }>;

    verifyRazorpayPayment(
        patientId: string,
        dto: VerifyRazorpayPaymentDTO
    ): Promise<{ appointmentId: string; paymentId: string }>;
}

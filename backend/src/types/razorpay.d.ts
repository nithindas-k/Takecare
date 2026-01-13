declare module "razorpay" {
    interface RazorpayOptions {
        key_id: string;
        key_secret: string;
    }

    interface RazorpayOrder {
        id: string;
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, string>;
    }

    interface RazorpayOrders {
        create(options: {
            amount: number;
            currency: string;
            receipt?: string;
            notes?: Record<string, string>;
        }): Promise<RazorpayOrder>;
    }

    class Razorpay {
        constructor(options: RazorpayOptions);
        orders: RazorpayOrders;
    }

    export default Razorpay;
}

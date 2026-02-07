import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../configs/env";
import { AppError } from "../errors/AppError";
import { HttpStatus, MESSAGES, PAYMENT_DEFAULTS, PAYMENT_STATUS, ROLES, APPOINTMENT_STATUS, APPOINTMENT_LOCKS, CRYPTO } from "../constants/constants";
import type { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import type { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import type { IUserRepository } from "../repositories/interfaces/IUser.repository";
import type { IPaymentService } from "./interfaces/IPaymentService";
import type { IWalletService } from "./interfaces/IWalletService";

import type { INotificationService } from "./notification.service";
import type { CreateRazorpayOrderDTO, VerifyRazorpayPaymentDTO } from "../dtos/payment.dtos/razorpay.dto";


import { ILoggerService } from "./interfaces/ILogger.service";

export class PaymentService implements IPaymentService {
    private readonly _razorpay: InstanceType<typeof Razorpay>;

    constructor(
        private _appointmentRepository: IAppointmentRepository,
        private _doctorRepository: IDoctorRepository,
        private _userRepository: IUserRepository,
        private _walletService: IWalletService,
        private _logger: ILoggerService,
        private _notificationService?: INotificationService
    ) {
        this._razorpay = new Razorpay({
            key_id: env.RAZORPAY_API_KEY,
            key_secret: env.RAZORPAY_API_SECRET,
        });
    }

    private _ensureKeys(): void {
        const missing: string[] = [];
        if (!env.RAZORPAY_API_KEY) missing.push("RAZORPAY_API_KEY (or RAZORPAY_KEY_ID)");
        if (!env.RAZORPAY_API_SECRET) missing.push("RAZORPAY_API_SECRET (or RAZORPAY_KEY_SECRET)");

        if (missing.length > 0) {
            throw new AppError(
                MESSAGES.RAZORPAY_KEYS_NOT_CONFIGURED.replace("{missing}", missing.join(", ")),
                HttpStatus.INTERNAL_ERROR
            );
        }
    }

    async createRazorpayOrder(
        patientId: string,
        dto: CreateRazorpayOrderDTO
    ): Promise<{ keyId: string; orderId: string; amount: number; currency: string }> {
        this._ensureKeys();
        const { appointmentId, amount, currency = PAYMENT_DEFAULTS.CURRENCY } = dto;

        if (!appointmentId) {
            throw new AppError(MESSAGES.PAYMENT_APPOINTMENT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
        }

        if (!amount || amount <= 0) {
            throw new AppError(MESSAGES.PAYMENT_AMOUNT_INVALID, HttpStatus.BAD_REQUEST);
        }

        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        if (appointment.patientId.toString() !== patientId) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        if (appointment.paymentStatus === PAYMENT_STATUS.PAID) {
            throw new AppError(MESSAGES.APPOINTMENT_ALREADY_PAID, HttpStatus.BAD_REQUEST);
        }

        if (appointment.razorpayOrderId) {
            this._logger.info("Reusing existing Razorpay order", {
                appointmentId,
                orderId: appointment.razorpayOrderId
            });
            return {
                keyId: env.RAZORPAY_API_KEY!,
                orderId: appointment.razorpayOrderId,
                amount: Math.round(Number(amount) * PAYMENT_DEFAULTS.PAISE_MULTIPLIER),
                currency: currency,
            };
        }


        const conflictingAppointment = await this._appointmentRepository.findOne({
            doctorId: appointment.doctorId,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            _id: { $ne: appointment._id },
            $or: [
                { paymentStatus: PAYMENT_STATUS.PAID },
                { status: APPOINTMENT_STATUS.CONFIRMED },
                { checkoutLockUntil: { $gt: new Date() } }
            ]
        });

        if (conflictingAppointment) {
            this._logger.warn("Slot conflict detected", {
                currentAppt: appointmentId,
                conflictingAppt: conflictingAppointment.id
            });
            throw new AppError(MESSAGES.SLOT_CONFLICT, HttpStatus.CONFLICT);
        }


        const lockDuration = APPOINTMENT_LOCKS.PAYMENT_LOCK_MINUTES * 60 * 1000;
        await this._appointmentRepository.updateById(appointmentId, {
            checkoutLockUntil: new Date(Date.now() + lockDuration)
        });


        const amountInPaise = Math.round(Number(amount) * PAYMENT_DEFAULTS.PAISE_MULTIPLIER);

        const order = await this._razorpay.orders.create({
            amount: amountInPaise,
            currency,
            receipt: `apt_${appointment.customId || appointment._id.toString()}`,
            notes: {
                appointmentId: appointment._id.toString(),
            },
        });


        await this._appointmentRepository.updateById(appointmentId, {
            razorpayOrderId: order.id
        });

        this._logger.info("Razorpay order created", {
            appointmentId,
            orderId: order.id,
            amount: order.amount,
        });

        return {
            keyId: env.RAZORPAY_API_KEY!,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        };
    }

    async unlockSlot(appointmentId: string): Promise<void> {
        this._ensureKeys();
        if (!appointmentId) return;


        await this._appointmentRepository.updateById(appointmentId, {
            checkoutLockUntil: null
        });

        this._logger.info("Slot unlocked manually", { appointmentId });
    }

    async verifyRazorpayPayment(
        patientId: string,
        dto: VerifyRazorpayPaymentDTO
    ): Promise<{ appointmentId: string; paymentId: string }> {
        this._ensureKeys();
        const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = dto;

        if (!appointmentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new AppError(MESSAGES.PAYMENT_FIELDS_MISSING, HttpStatus.BAD_REQUEST);
        }

        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        if (appointment.patientId.toString() !== patientId) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        if (appointment.paymentStatus === PAYMENT_STATUS.PAID) {
            throw new AppError(MESSAGES.APPOINTMENT_ALREADY_PAID, HttpStatus.BAD_REQUEST);
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac(CRYPTO.RAZORPAY_SIGNATURE_ALGORITHM, env.RAZORPAY_API_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            this._logger.warn("Razorpay signature mismatch", {
                appointmentId,
                razorpay_order_id,
                razorpay_payment_id,
            });

            await this._appointmentRepository.updateById(appointmentId, { checkoutLockUntil: null });
            throw new AppError(MESSAGES.PAYMENT_VERIFICATION_FAILED, HttpStatus.BAD_REQUEST);
        }

        await this._appointmentRepository.updateById(appointmentId, {
            paymentStatus: PAYMENT_STATUS.PAID,
            paymentId: razorpay_payment_id,
            checkoutLockUntil: null
        });

        if (this._notificationService) {
            await this._notificationService.notify(patientId, {
                title: "Payment Successful",
                message: `Your payment of ₹${appointment.consultationFees} for appointment #${appointment.customId || appointmentId} was successful.`,
                type: "success",
                appointmentId: appointment._id.toString()
            });
        }


        const doctor = await this._doctorRepository.findById(appointment.doctorId.toString());
        const patient = await this._userRepository.findById(appointment.patientId.toString());

        if (doctor) {
            await this._walletService.addMoney(
                doctor.userId.toString(),
                appointment.doctorEarnings,
                `Consultation Earnings from ${appointment.customId || appointmentId}`,
                appointment._id.toString(),
                "Consultation Fee"
            );

            if (this._notificationService) {
                await this._notificationService.notify(doctor.userId.toString(), {
                    title: "Appointment Paid & Confirmed",
                    message: `Payment for appointment #${appointment.customId || appointmentId} from ${patient?.name || 'Patient'} has been verified.`,
                    type: "success",
                    appointmentId: appointment._id.toString()
                });
            }
        }


        const admins = await this._userRepository.findByRole(ROLES.ADMIN);
        const adminUser = admins[0];
        if (adminUser) {
            await this._walletService.addMoney(
                adminUser._id.toString(),
                appointment.adminCommission,
                `Commission from ${appointment.customId || appointmentId}`,
                appointment._id.toString(),
                "Consultation Fee"
            );


        }

        this._logger.info("Razorpay payment verified and split performed", {
            appointmentId,
            paymentId: razorpay_payment_id,
            doctorEarnings: appointment.doctorEarnings,
            adminCommission: appointment.adminCommission,
        });

        return {
            appointmentId,
            paymentId: razorpay_payment_id,
        };
    }
}

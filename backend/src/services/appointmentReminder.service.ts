import cron from "node-cron";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IScheduleRepository } from "../repositories/interfaces/ISchedule.repository";
import { NotificationService } from "./notification.service";
import { socketService } from "./socket.service";
import { ILoggerService } from "./interfaces/ILogger.service";
import { APPOINTMENT_STATUS, PAYMENT_STATUS, NOTIFICATION_TYPES } from "../constants/constants";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { differenceInMinutes, startOfDay, endOfDay } from "date-fns";
import { parseAppointmentTime } from "../utils/time.util";

export class AppointmentReminderService {
    private _appointmentRepository: IAppointmentRepository;
    private _scheduleRepository: IScheduleRepository;
    private _notificationService: NotificationService;
    private _cronJob: any = null;
    private readonly _timezone = "Asia/Kolkata";

    constructor(
        appointmentRepository: IAppointmentRepository,
        scheduleRepository: IScheduleRepository,
        notificationService: NotificationService,
        private _logger: ILoggerService
    ) {
        this._appointmentRepository = appointmentRepository;
        this._scheduleRepository = scheduleRepository;
        this._notificationService = notificationService;
    }

    start() {
        this._cronJob = cron.schedule("* * * * *", async () => {
            await this._checkUpcomingAppointments();
        });

        cron.schedule("*/5 * * * *", async () => {
            await this._cleanupPendingAppointments();
        });

        this._logger.info("Appointment reminder service started with timezone: " + this._timezone);
    }

    stop() {
        if (this._cronJob) {
            this._cronJob.stop();
            this._logger.info("Appointment reminder service stopped");
        }
    }

    private async _cleanupPendingAppointments() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            const pendingAppointments = await this._appointmentRepository.find({
                status: APPOINTMENT_STATUS.PENDING,
                paymentStatus: PAYMENT_STATUS.PENDING,
                createdAt: { $lt: fiveMinutesAgo }
            });

            if (pendingAppointments.length > 0) {
                this._logger.info(`Found ${pendingAppointments.length} abandoned pending appointments causing slot blockage. Cleaning up...`);

                let deletedCount = 0;
                for (const appt of pendingAppointments) {

                    if (appt.slotId && appt.doctorId) {
                        const startTime = parseAppointmentTime(appt.appointmentTime);
                        await this._scheduleRepository.updateSlotBookedStatus(
                            appt.doctorId.toString(),
                            appt.slotId,
                            false,
                            new Date(appt.appointmentDate),
                            startTime
                        );
                        this._logger.info(`Released slot ${appt.slotId} for abandoned appointment ${appt._id}`);
                    }
                    await this._appointmentRepository.deleteById(appt._id.toString());
                    deletedCount++;
                }

                this._logger.info(`Successfully cleaned up ${deletedCount} abandoned appointments.`);
            }
        } catch (error) {
            this._logger.error("Error cleaning up pending appointments", error);
        }
    }

    private async _checkUpcomingAppointments() {
        try {

            const now = new Date();
            const nowInIST = toZonedTime(now, this._timezone);


            const startOfToday = startOfDay(nowInIST);
            const endOfToday = endOfDay(nowInIST);

            const appointments = await this._appointmentRepository.findWithPopulate({
                appointmentDate: {
                    $gte: fromZonedTime(startOfToday, this._timezone),
                    $lte: fromZonedTime(endOfToday, this._timezone)
                },
                status: APPOINTMENT_STATUS.CONFIRMED,
                $or: [
                    { reminderSent: { $ne: true } },
                    { startNotificationSent: { $ne: true } }
                ]
            }, "doctorId");

            this._logger.debug(`Found ${appointments.length} confirmed appointments for today to check in ${this._timezone}.`);

            for (const appointment of appointments) {
                const timeParts = appointment.appointmentTime.split("-");
                if (timeParts.length === 0) continue;

                const startTimeStr = timeParts[0].trim();
                const [hours, minutes] = startTimeStr.split(":").map(Number);

                // 1. Get the proper "Day" in IST from the UTC appointmentDate
                // Since appointmentDate is stored as 00:00 UTC, we must ensure we get the correct IST date component
                const appDateInIST = toZonedTime(new Date(appointment.appointmentDate), this._timezone);

                // 2. Construct a Date object that has IST values in its LocalTime fields
                // This matches the format of nowInIST, allowing for direct comparison
                const appStartInIST = new Date(
                    appDateInIST.getFullYear(),
                    appDateInIST.getMonth(),
                    appDateInIST.getDate(),
                    hours,
                    minutes,
                    0,
                    0
                );

                // 3. Calculate difference using the "IST-valued" date objects
                const minutesDiff = differenceInMinutes(appStartInIST, nowInIST);

                this._logger.debug(`Checking appointment ${appointment.customId}:`, {
                    nowInIST: nowInIST.toLocaleTimeString('en-US', { timeZone: this._timezone }),
                    appStartInIST: appStartInIST.toLocaleTimeString('en-US', { timeZone: this._timezone }),
                    minutesUntilStart: minutesDiff
                });

                // Send 5-minute reminder
                if (minutesDiff > 4 && minutesDiff <= 6 && !appointment.reminderSent) {
                    await this._sendNotification(appointment, NOTIFICATION_TYPES.WARNING, {
                        title: "Appointment Starting Soon!",
                        message: `Your appointment #${appointment.customId} is starting in 5 minutes.`,
                    });
                    await this._appointmentRepository.updateById(appointment._id.toString(), { reminderSent: true });
                }

                // Send "Join Now" notification (0 to 2 minutes window)
                if (minutesDiff <= 0 && minutesDiff >= -2 && !appointment.startNotificationSent) {
                    await this._sendNotification(appointment, NOTIFICATION_TYPES.SUCCESS, {
                        title: "Consultation Ready!",
                        message: `Your appointment #${appointment.customId} is starting now. You can join the session.`,
                        type: "appointment_started"
                    });
                    await this._appointmentRepository.updateById(appointment._id.toString(), { startNotificationSent: true });
                }
            }
        } catch (error) {
            this._logger.error("Error checking upcoming appointments with timezone logic", error);
        }
    }

    private async _sendNotification(appointment: any, type: "warning" | "success" | "info" | "error", data: any) {
        const reminderData = {
            ...data,
            appointmentId: appointment._id.toString(),
            customId: appointment.customId,
            type: data.type || type
        };

        const doctorDoc = appointment.doctorId as any;
        const doctorUserId = doctorDoc?.userId?.toString();
        const patientId = appointment.patientId.toString();

        if (doctorUserId) {

            await this._notificationService.notify(patientId, reminderData);
            await this._notificationService.notify(doctorUserId, reminderData);


            socketService.sendReminder(patientId, reminderData);
            socketService.sendReminder(doctorUserId, reminderData);

            this._logger.info(`Notification sent for appointment ${appointment.customId}: ${data.title}`);
        }
    }
}

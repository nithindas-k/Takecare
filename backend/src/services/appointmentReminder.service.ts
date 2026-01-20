import cron from "node-cron";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IScheduleRepository } from "../repositories/interfaces/ISchedule.repository";
import { NotificationService } from "./notification.service";
import { socketService } from "./socket.service";
import { ILoggerService } from "./interfaces/ILogger.service";
import { APPOINTMENT_STATUS } from "../constants/constants";

export class AppointmentReminderService {
    private _appointmentRepository: IAppointmentRepository;
    private _scheduleRepository: IScheduleRepository;
    private _notificationService: NotificationService;
    private _cronJob: any = null;

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
        // checking 
        this._cronJob = cron.schedule("* * * * *", async () => {
            await this._checkUpcomingAppointments();
        });

        // clean up in  5  minutes
        cron.schedule("*/5 * * * *", async () => {
            await this._cleanupPendingAppointments();
        });

        this._logger.info("Appointment reminder service started");
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
                paymentStatus: "pending",
                createdAt: { $lt: fiveMinutesAgo }
            });

            if (pendingAppointments.length > 0) {
                this._logger.info(`Found ${pendingAppointments.length} abandoned pending appointments causing slot blockage. Cleaning up...`);

                let deletedCount = 0;
                for (const appt of pendingAppointments) {

                    if (appt.slotId && appt.doctorId) {
                        const [startTime] = appt.appointmentTime.split("-").map((t: string) => t.trim());
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
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            const appointments = await this._appointmentRepository.findWithPopulate({
                appointmentDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                status: APPOINTMENT_STATUS.CONFIRMED,
                $or: [
                    { reminderSent: { $ne: true } },
                    { startNotificationSent: { $ne: true } }
                ]
            }, "doctorId");

            this._logger.debug(`Found ${appointments.length} confirmed appointments for today to check for reminders.`);

            for (const appointment of appointments) {

                const timeParts = appointment.appointmentTime.split("-");
                if (timeParts.length === 0) continue;

                const startTime = timeParts[0].trim();
                const [hours, minutes] = startTime.split(":").map(Number);

                const appointmentDateTime = new Date(appointment.appointmentDate);
                appointmentDateTime.setHours(hours, minutes, 0, 0);

                const timeDiffMs = appointmentDateTime.getTime() - now.getTime();
                const minutesDiff = timeDiffMs / (1000 * 60);

                this._logger.debug(`Checking appointment ${appointment.customId}:`, {
                    currentTime: now.toLocaleTimeString(),
                    targetTime: appointmentDateTime.toLocaleTimeString(),
                    minutesUntilStart: minutesDiff.toFixed(2)
                });

                if (minutesDiff > 4.5 && minutesDiff <= 5.5 && !appointment.reminderSent) {
                    this._logger.info(`Sending 5-minute reminder for appointment ${appointment.customId}`);

                    const reminderData = {
                        title: "Appointment Starting Soon!",
                        message: `Your appointment #${appointment.customId} is starting in 5 minutes.`,
                        appointmentId: appointment._id.toString(),
                        customId: appointment.customId
                    };

                    const doctorDoc = appointment.doctorId as any;
                    const doctorUserId = doctorDoc?.userId?.toString();
                    const patientId = appointment.patientId.toString();

                    if (doctorUserId) {
                        await this._notificationService.notify(patientId, {
                            ...reminderData,
                            type: "warning",
                        });

                        await this._notificationService.notify(doctorUserId, {
                            ...reminderData,
                            type: "warning",
                        });

                        socketService.sendReminder(patientId, reminderData);
                        socketService.sendReminder(doctorUserId, reminderData);

                        await this._appointmentRepository.updateById(appointment._id.toString(), {
                            reminderSent: true
                        });

                        this._logger.info(`5-minute reminder sent for appointment ${appointment.customId}`);
                    }
                }

                // Start Time
                if (minutesDiff <= 0 && minutesDiff >= -2 && !appointment.startNotificationSent) {
                    this._logger.info(`Sending start-time notification for appointment ${appointment.customId}`);

                    const startData = {
                        title: "Consultation Ready!",
                        message: `Your appointment #${appointment.customId} is starting now. You can join the session.`,
                        appointmentId: appointment._id.toString(),
                        customId: appointment.customId,
                        type: "appointment_started"
                    };

                    const doctorDoc = appointment.doctorId as any;
                    const doctorUserId = doctorDoc?.userId?.toString();
                    const patientId = appointment.patientId.toString();

                    if (doctorUserId) {

                        await this._notificationService.notify(patientId, {
                            ...startData,
                            type: "success",
                        });


                        await this._notificationService.notify(doctorUserId, {
                            ...startData,
                            type: "success",
                        });


                        socketService.sendReminder(patientId, startData);
                        socketService.sendReminder(doctorUserId, startData);

                        await this._appointmentRepository.updateById(appointment._id.toString(), {
                            startNotificationSent: true
                        });

                        this._logger.info(`Start-time notification sent for appointment ${appointment.customId}`);
                    }
                }
            }
        } catch (error) {
            this._logger.error("Error checking upcoming appointments", error);
        }
    }
}

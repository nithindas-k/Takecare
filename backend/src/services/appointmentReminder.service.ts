import cron from "node-cron";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { NotificationService } from "./notification.service";
import { socketService } from "./socket.service";
import { LoggerService } from "./logger.service";
import { APPOINTMENT_STATUS } from "../constants/constants";

export class AppointmentReminderService {
    private readonly logger: LoggerService;
    private appointmentRepository: AppointmentRepository;
    private notificationService: NotificationService;
    private cronJob: any = null;

    constructor(
        appointmentRepository: AppointmentRepository,
        notificationService: NotificationService
    ) {
        this.logger = new LoggerService("AppointmentReminderService");
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
    }

    start() {
        // checking 
        this.cronJob = cron.schedule("* * * * *", async () => {
            await this.checkUpcomingAppointments();
        });

        // clean up in ev 5  minutes
        cron.schedule("*/5 * * * *", async () => {
            await this.cleanupPendingAppointments();
        });

        this.logger.info("Appointment reminder service started");
    }

    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.logger.info("Appointment reminder service stopped");
        }
    }

    private async cleanupPendingAppointments() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            const pendingAppointments = await this.appointmentRepository.find({
                status: APPOINTMENT_STATUS.PENDING,
                paymentStatus: "pending",
                createdAt: { $lt: fiveMinutesAgo }
            });

            if (pendingAppointments.length > 0) {
                this.logger.info(`Found ${pendingAppointments.length} abandoned pending appointments causing slot blockage. Cleaning up...`);

                let deletedCount = 0;
                for (const appt of pendingAppointments) {
                    await this.appointmentRepository.deleteById(appt._id.toString());
                    deletedCount++;
                }

                this.logger.info(`Successfully cleaned up ${deletedCount} abandoned appointments.`);
            }
        } catch (error) {
            this.logger.error("Error cleaning up pending appointments", error);
        }
    }

    private async checkUpcomingAppointments() {
        try {
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            const appointments = await this.appointmentRepository.findWithPopulate({
                appointmentDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                status: APPOINTMENT_STATUS.CONFIRMED,
                reminderSent: { $ne: true }
            }, "doctorId");

            this.logger.debug(`Found ${appointments.length} confirmed appointments for today to check for reminders.`);

            for (const appointment of appointments) {
             
                const timeParts = appointment.appointmentTime.split("-");
                if (timeParts.length === 0) continue;

                const startTime = timeParts[0].trim();
                const [hours, minutes] = startTime.split(":").map(Number);

                const appointmentDateTime = new Date(appointment.appointmentDate);
                appointmentDateTime.setHours(hours, minutes, 0, 0);

                const timeDiffMs = appointmentDateTime.getTime() - now.getTime();
                const minutesDiff = timeDiffMs / (1000 * 60);

                this.logger.debug(`Checking appointment ${appointment.customId}:`, {
                    currentTime: now.toLocaleTimeString(),
                    targetTime: appointmentDateTime.toLocaleTimeString(),
                    minutesUntilStart: minutesDiff.toFixed(2)
                });

                if (minutesDiff > 4.5 && minutesDiff <= 5.5) {
                    this.logger.info(`Sending 5-minute reminder for appointment ${appointment.customId}`);

                    const reminderData = {
                        title: "Appointment Starting Soon!",
                        message: `Your appointment #${appointment.customId} is starting in 5 minutes.`,
                        appointmentId: appointment._id.toString(),
                        customId: appointment.customId
                    };

                    const doctorDoc = appointment.doctorId as any;
                    const doctorUserId = doctorDoc?.userId?.toString();
                    const patientId = appointment.patientId.toString();

                    if (!doctorUserId) {
                        this.logger.warn(`Could not find doctor userId for appointment ${appointment.customId}`);
                        continue;
                    }

                
                    await this.notificationService.notify(patientId, {
                        ...reminderData,
                        type: "warning",
                    });

                
                    await this.notificationService.notify(doctorUserId, {
                        ...reminderData,
                        type: "warning",
                    });

                    
                    socketService.sendReminder(patientId, reminderData);
                    socketService.sendReminder(doctorUserId, reminderData);

                
                    await this.appointmentRepository.updateById(appointment._id.toString(), {
                        reminderSent: true
                    });

                    this.logger.info(`5-minute reminder sent for appointment ${appointment.customId}`);
                }
            }
        } catch (error) {
            this.logger.error("Error checking upcoming appointments", error);
        }
    }
}

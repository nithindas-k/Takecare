import dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { connectDB } from "./configs/database";
import { env } from "./configs/env";
import { MESSAGES, CONFIG, HttpStatus } from "./constants/constants";
import { BASE_ROUTES } from "./constants/routes.constants";
import userRouter from "./routers/user.router";
import authRouter from "./routers/auth.route";
import doctorRouter from './routers/doctor.router';
import adminRouter from "./routers/admin.route";
import appointmentRouter from "./routers/appointment.router";
import paymentRouter from "./routers/payment.router";
import walletRouter from "./routers/wallet.router";
import notificationRouter from "./routers/notification.router";
import chatRouter from "./routers/chat.router";
import reviewRouter from "./routers/review.route";
import prescriptionRouter from "./routers/prescription.router";
import specialtyRouter from "./routers/specialty.router";
import contactRouter from "./routes/contact.routes";
import callRouter from "./routers/call.router";

import { errorHandler } from "./middlewares/error-handler.middleware";
import { LoggerService } from "./services/logger.service";

import "./services/passport.service";

const logger = new LoggerService("App");

const app = express();

const corsOptions = {
  origin: env.CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(cors(corsOptions));
app.use(morgan("dev"))


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    secret: env.SESSION_SECRET, //=
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: CONFIG.SESSION_MAX_AGE, //=
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TackCare API is running...",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});


app.use(BASE_ROUTES.USERS, userRouter);



app.use(BASE_ROUTES.AUTH, authRouter);
app.use(BASE_ROUTES.DOCTORS, doctorRouter);
app.use(BASE_ROUTES.ADMIN, adminRouter);
app.use(BASE_ROUTES.APPOINTMENTS, appointmentRouter);
app.use(BASE_ROUTES.PAYMENTS, paymentRouter);
app.use(BASE_ROUTES.WALLET, walletRouter);
app.use(BASE_ROUTES.NOTIFICATIONS, notificationRouter);
app.use(BASE_ROUTES.CHAT, chatRouter);

app.use(BASE_ROUTES.REVIEWS, reviewRouter);
app.use(BASE_ROUTES.PRESCRIPTIONS, prescriptionRouter);
app.use(BASE_ROUTES.SPECIALTIES, specialtyRouter);
app.use(BASE_ROUTES.CONTACT, contactRouter);
app.use(BASE_ROUTES.CALL, callRouter);




app.use((req, res) => {
  res.status(HttpStatus.NOT_FOUND).json({ //=
    success: false,
    message: MESSAGES.ROUTE_NOT_FOUND,
    path: req.originalUrl,
  });
});


app.use(errorHandler);

import { createServer } from "http";
import { socketService } from "./services/socket.service";
import { AppointmentReminderService } from "./services/appointmentReminder.service";
import { SessionTimerService } from "./services/sessionTimer.service";
import { AppointmentRepository } from "./repositories/appointment.repository";
import { ScheduleRepository } from "./repositories/schedule.repository";
import { notificationService } from "./routers/notification.router";

const appointmentRepository = new AppointmentRepository();
const scheduleRepository = new ScheduleRepository();
const appointmentReminderService = new AppointmentReminderService(
  appointmentRepository,
  scheduleRepository,
  notificationService,
  new LoggerService("AppointmentReminderService")
);
appointmentReminderService.start();

const sessionTimerService = new SessionTimerService(
  appointmentRepository,
  new LoggerService("SessionTimerService")
);
sessionTimerService.start();

const PORT = Number(env.PORT);

const httpServer = createServer(app);
socketService.init(httpServer);

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error("Server startup failed", error);
    process.exit(1);
  }
};

startServer();

export default app;

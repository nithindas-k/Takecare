import dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import morgan  from "morgan";

import { connectDB } from "./configs/database";
import userRouter from "./routers/user.router";
import authRouter from "./routers/auth.route";
import doctorRouter from './routers/doctor.router';
import adminRouter from "./routers/admin.route"

import "./services/passport.service"; 

const app = express();

const corsOptions = {
  origin: "http://localhost:5173", 
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"))); 
app.use(cors(corsOptions));
app.use(morgan("dev"))


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, 
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


app.use("/users", userRouter);    



app.use("/auth", authRouter);
app.use('/doctors', doctorRouter);
app.use("/admin",adminRouter)


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(`API Base: http://localhost:${PORT}/api`);

    });
  } catch (error) {

    process.exit(1);
  }
};

startServer();

export default app;

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requirePatient } from "../middlewares/role.middleware";

const router = Router();


export default router;

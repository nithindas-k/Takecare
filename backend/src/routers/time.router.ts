import { Router } from "express";
import { TimeController } from "../controllers/time.controller";

const router = Router();
const timeController = new TimeController();

/**
 * @route GET /api/time/server
 * @desc Get current server time for synchronization
 * @access Public
 */
router.get("/server", timeController.getServerTime);

export default router;

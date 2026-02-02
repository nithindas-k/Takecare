import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireDoctor, requireAdmin } from "../middlewares/role.middleware";
import { AI_ROUTES } from "../constants/routes.constants";

const aiRouter = Router();

aiRouter.post(AI_ROUTES.ANALYZE, aiController.analyzeSymptoms);

aiRouter.post(AI_ROUTES.CHAT_SUMMARY, authMiddleware, requireDoctor, aiController.summarizeChat);

aiRouter.post(AI_ROUTES.ADMIN_QUERY, authMiddleware, requireAdmin, aiController.analyzeAdminQuery);

export default aiRouter;

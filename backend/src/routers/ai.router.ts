import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requirePatient } from "../middlewares/role.middleware";
import { checkUserBlocked } from "../middlewares/check-user-blocked.middleware";
import { AIController } from "../controllers/ai.controller";
import { AI_ROUTES } from "../constants/routes.constants";

import { AIConversationRepository } from "../repositories/aiConversation.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { AIMatchingService } from "../services/aiMatching.service";
import AIConversationModel from "../models/aiConversation.model";

const router = Router();


const aiConversationRepository = new AIConversationRepository(AIConversationModel);
const doctorRepository = new DoctorRepository();
const aiMatchingService = new AIMatchingService(aiConversationRepository, doctorRepository);
const aiController = new AIController(aiMatchingService);


router.post(
    AI_ROUTES.MATCH_DOCTOR,
    authMiddleware,
    checkUserBlocked,
    requirePatient,
    aiController.processChatMessage
);

router.get(
    AI_ROUTES.MATCH_HISTORY,
    authMiddleware,
    checkUserBlocked,
    requirePatient,
    aiController.getConversationHistory
);

router.post(
    AI_ROUTES.MATCH_RESET,
    authMiddleware,
    checkUserBlocked,
    requirePatient,
    aiController.resetConversation
);

export default router;

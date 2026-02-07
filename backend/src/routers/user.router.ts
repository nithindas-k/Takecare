import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requirePatient } from "../middlewares/role.middleware";
import { UserController } from "../controllers/user.controller";
import { USER_ROUTES } from "../constants/routes.constants";
import { upload } from "../middlewares/upload.middleware";
import { checkUserBlocked } from "../middlewares/check-user-blocked.middleware";

import { DoctorRepository } from "../repositories/doctor.repository";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";

const router = Router();

const userRepository = new UserRepository();
const doctorRepository = new DoctorRepository();
const userService = new UserService(userRepository, doctorRepository);
const userController = new UserController(userService);

router.get(
    USER_ROUTES.PROFILE,
    authMiddleware,
    checkUserBlocked,
    userController.getProfile
);

router.put(
    USER_ROUTES.PROFILE,
    authMiddleware,
    checkUserBlocked,
    upload.single("profileImage"),
    userController.updateProfile
);


router.post(
    USER_ROUTES.TOGGLE_FAVORITE,
    authMiddleware,
    checkUserBlocked,
    requirePatient,
    userController.toggleFavorite
);

router.get(
    USER_ROUTES.GET_FAVORITES,
    authMiddleware,
    checkUserBlocked,
    requirePatient,
    userController.getFavorites
);


export default router;

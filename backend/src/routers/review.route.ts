import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { ReviewService } from "../services/review.service";
import { ReviewRepository } from "../repositories/review.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";
import { checkUserBlocked } from "../middlewares/check-user-blocked.middleware";
import { NotificationRepository } from "../repositories/notification.repository";
import { NotificationService } from "../services/notification.service";
import { UserRepository } from "../repositories/user.repository";

const reviewRouter = Router();

const reviewRepository = new ReviewRepository();
const doctorRepository = new DoctorRepository();
const notificationRepository = new NotificationRepository();
const userRepository = new UserRepository();
const notificationService = new NotificationService(notificationRepository);
const reviewService = new ReviewService(reviewRepository, doctorRepository, notificationService, userRepository);
const reviewController = new ReviewController(reviewService);

// Admin routes
reviewRouter.get("/", authMiddleware, checkUserBlocked, requireAdmin, reviewController.getAllReviews);
reviewRouter.delete("/admin/:reviewId", authMiddleware, checkUserBlocked, requireAdmin, reviewController.deleteReviewByAdmin);

reviewRouter.get("/doctor/:doctorId", reviewController.getDoctorReviews);
reviewRouter.get("/my-reviews", authMiddleware, reviewController.getMyReviews);
reviewRouter.get("/doctor/:doctorId/stats", reviewController.getDoctorStats);

reviewRouter.post("/", authMiddleware, reviewController.addReview);
reviewRouter.put("/:reviewId", authMiddleware, reviewController.updateReview);
reviewRouter.delete("/:reviewId", authMiddleware, reviewController.deleteReview);
reviewRouter.get("/patient-doctor/:doctorId", authMiddleware, reviewController.getReviewByPatientAndDoctor);
reviewRouter.put("/respond/:reviewId", authMiddleware, reviewController.respondToReview);

export default reviewRouter;

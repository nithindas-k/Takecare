import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { ReviewService } from "../services/review.service";
import { ReviewRepository } from "../repositories/review.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";
import { checkUserBlocked } from "../middlewares/check-user-blocked.middleware";

const reviewRouter = Router();

const reviewRepository = new ReviewRepository();
const doctorRepository = new DoctorRepository();
const reviewService = new ReviewService(reviewRepository, doctorRepository);
const reviewController = new ReviewController(reviewService);

// Admin routes
reviewRouter.get("/", authMiddleware, checkUserBlocked, requireAdmin, reviewController.getAllReviews);
reviewRouter.delete("/admin/:reviewId", authMiddleware, checkUserBlocked, requireAdmin, reviewController.deleteReviewByAdmin);

reviewRouter.get("/doctor/:doctorId", reviewController.getDoctorReviews);
reviewRouter.get("/doctor/:doctorId/stats", reviewController.getDoctorStats);

reviewRouter.post("/", authMiddleware, reviewController.addReview);
reviewRouter.put("/:reviewId", authMiddleware, reviewController.updateReview);
reviewRouter.delete("/:reviewId", authMiddleware, reviewController.deleteReview);
reviewRouter.get("/patient-doctor/:doctorId", authMiddleware, reviewController.getReviewByPatientAndDoctor);

export default reviewRouter;

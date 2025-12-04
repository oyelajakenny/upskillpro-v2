import "dotenv/config";
import express from "express";
import authenticateToken from "../../middlewares/authenticateToken.js";
import authorizeRole from "../../middlewares/authorizeRole.js";
import { createEnrollment } from "../../controllers/dynamodb/enrollmentController.js";
import { getEnrolledCourses } from "../../controllers/dynamodb/enrollmentController.js";
import { getProgress } from "../../controllers/dynamodb/progressController.js";
import { getEnrollmentDetails } from "../../controllers/dynamodb/progressController.js";
import { updateProgress } from "../../controllers/dynamodb/progressController.js";
import { markAllCompleted } from "../../controllers/dynamodb/progressController.js";
import { removeAllLectureId } from "../../controllers/dynamodb/progressController.js";
import { getInstructorRevenue } from "../../controllers/dynamodb/enrollmentController.js";
import { courseWithProgress } from "../../controllers/dynamodb/progressController.js";
const enrollRouter = express.Router();

enrollRouter.post(
  "/:id",
  authenticateToken,
  authorizeRole("student"),
  createEnrollment
);

enrollRouter.get(
  "/all",
  authenticateToken,
  authorizeRole("student"),
  getEnrolledCourses
);

enrollRouter.get(
  "/:id/progress",
  authenticateToken,
  authorizeRole("student"),
  getProgress
);

enrollRouter.get(
  "/:id/details",
  authenticateToken,
  authorizeRole("student"),
  getEnrollmentDetails
);
enrollRouter.put(
  "/:id/progress",
  authenticateToken,
  authorizeRole("student"),
  updateProgress
);

enrollRouter.post(
  "/:id/mark-all-completed",
  authenticateToken,
  authorizeRole("student"),
  markAllCompleted
);

enrollRouter.post(
  "/:id/remove-all",
  authenticateToken,
  authorizeRole("student"),
  removeAllLectureId
);

enrollRouter.get(
  "/revenue",
  authenticateToken,
  authorizeRole("instructor"),
  getInstructorRevenue
);

enrollRouter.get(
  "/my-learning",
  authenticateToken,
  authorizeRole("student"),
  courseWithProgress
);
export default enrollRouter;

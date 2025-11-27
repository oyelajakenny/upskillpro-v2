import "dotenv/config";
import express from "express";
import {
  createCourse,
  getCoursesByInstructor,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../../controllers/dynamodb/courseController.js";
import {
  createLecture,
  getLecturesByCourseId,
} from "../../controllers/dynamodb/lectureController.js";
import authenticateToken from "../../middlewares/authenticateToken.js";
import authorizeRole from "../../middlewares/authorizeRole.js";
import { getNumberOfEnrolledStudents } from "../../controllers/dynamodb/enrollmentController.js";

const courseRouter = express.Router();

courseRouter.post(
  "/",
  authenticateToken,
  authorizeRole("instructor"),
  createCourse
);
courseRouter.get("/all", authenticateToken, getCoursesByInstructor);
courseRouter.get("/", getAllCourses);
courseRouter.get("/:id", getCourseById);
courseRouter.get(
  "/:id/enrolled-count",
  authenticateToken,
  authorizeRole("instructor"),
  getNumberOfEnrolledStudents
);
courseRouter.put(
  "/:id",
  authenticateToken,
  authorizeRole("instructor"),
  updateCourse
);
courseRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRole("instructor"),
  deleteCourse
);
courseRouter.post(
  "/:id/lectures",
  authenticateToken,
  authorizeRole("instructor"),
  createLecture
);
courseRouter.get(
  "/:id/lectures",
  authenticateToken,
  authorizeRole("student"),
  getLecturesByCourseId
);

export default courseRouter;

import { EnrollmentRepository } from "../../models/dynamodb/enrollment-repository.js";
import { LectureRepository } from "../../models/dynamodb/lecture-repository.js";
import { CourseRepository } from "../../models/dynamodb/course-repository.js";

const generateS3Url = (fileKey) => {
  const baseUrl = process.env.AWS_S3_BASE_URL;
  return `${baseUrl}/${fileKey}`;
};

const getProgress = async (req, res) => {
  try {
    const userId = req.user.sub;
    const courseId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "Invalid or missing userId." });
    }
    if (!courseId) {
      return res.status(400).json({ message: "Invalid or missing courseId." });
    }

    const enrollment = await EnrollmentRepository.findByUserAndCourse(
      userId,
      courseId,
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    if (!Array.isArray(enrollment.progress)) {
      return res
        .status(500)
        .json({ message: "Enrollment progress is invalid." });
    }

    res.status(200).json(enrollment.progress);
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

const updateProgress = async (req, res) => {
  const userId = req.user.sub;
  const courseId = req.params.id;
  const { lectureId } = req.body;

  if (!lectureId || !courseId || !userId) {
    return res
      .status(400)
      .json({ message: "Lecture ID, Course ID, and User ID are required." });
  }

  try {
    const enrollment = await EnrollmentRepository.findByUserAndCourse(
      userId,
      courseId,
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    if (!enrollment.progress.includes(lectureId)) {
      enrollment.progress.push(lectureId);

      await EnrollmentRepository.updateProgress(
        userId,
        courseId,
        enrollment.progress,
      );
    }

    return res
      .status(200)
      .json({ message: "Progress updated.", progress: enrollment.progress });
  } catch (error) {
    console.error("Error updating progress:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const markAllCompleted = async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.sub;

  if (!courseId || !userId) {
    return res
      .status(400)
      .json({ message: "Course ID and User ID are required." });
  }

  try {
    const lectures = await LectureRepository.findByCourse(courseId);
    const allLectureIds = lectures.map((lecture) => lecture.lectureId);

    const enrollment = await EnrollmentRepository.findByUserAndCourse(
      userId,
      courseId,
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    await EnrollmentRepository.updateProgress(userId, courseId, allLectureIds);

    return res.status(200).json({
      message: "All lectures marked as completed.",
      progress: allLectureIds,
    });
  } catch (error) {
    console.error("Error marking all lectures as completed:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const removeAllLectureId = async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.sub;

  if (!courseId || !userId) {
    return res
      .status(400)
      .json({ message: "Course ID and User ID are required." });
  }

  try {
    const enrollment = await EnrollmentRepository.findByUserAndCourse(
      userId,
      courseId,
    );

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    await EnrollmentRepository.updateProgress(userId, courseId, []);

    return res.status(200).json({
      message: "All lectures are removed.",
      progress: [],
    });
  } catch (error) {
    console.error("Error removing all lectures:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const courseWithProgress = async (req, res) => {
  const userId = req.user.sub;

  if (!userId) {
    return res.status(400).json({ message: "Invalid or missing userId." });
  }

  try {
    const enrollments = await EnrollmentRepository.findByUser(userId);

    if (enrollments.length === 0) {
      return res
        .status(404)
        .json({ message: "You do not have any enrolled courses" });
    }

    // Get all course IDs and fetch lectures for each
    const courseIds = enrollments.map((e) => e.courseId);
    const lecturesPromises = courseIds.map((courseId) =>
      LectureRepository.findByCourse(courseId),
    );
    const lecturesResults = await Promise.all(lecturesPromises);

    const learningProgress = enrollments.map((enrollment, index) => {
      const lectures = lecturesResults[index];
      const totalLectures = lectures.length;
      const completedLectureIds = new Set(enrollment.progress);
      const completedLectures = lectures.filter((lecture) =>
        completedLectureIds.has(lecture.lectureId),
      );

      const progressPercentage =
        totalLectures > 0
          ? (completedLectures.length / totalLectures) * 100
          : 0;

      const totalDurationSeconds = lectures.reduce(
        (sum, lecture) => sum + (lecture.durationSeconds || 0),
        0,
      );
      const completedDurationSeconds = completedLectures.reduce(
        (sum, lecture) => sum + (lecture.durationSeconds || 0),
        0,
      );

      return {
        courseId: enrollment.courseId,
        title: enrollment.courseTitle,
        imageUrl: generateS3Url(enrollment.courseImageKey),
        progress: Number(progressPercentage.toFixed(2)),
        totalLectures,
        completedLectures: completedLectures.length,
        totalDurationSeconds,
        completedDurationSeconds,
      };
    });

    return res.status(200).json(learningProgress);
  } catch (error) {
    console.error("Error fetching progress for the course:", error);
    return res
      .status(500)
      .json({ message: "Error fetching progress for the course" });
  }
};

export {
  getProgress,
  updateProgress,
  markAllCompleted,
  removeAllLectureId,
  courseWithProgress,
};

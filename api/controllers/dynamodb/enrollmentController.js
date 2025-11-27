import { EnrollmentRepository } from "../../models/dynamodb/enrollment-repository.js";
import { CourseRepository } from "../../models/dynamodb/course-repository.js";
import { UserRepository } from "../../models/dynamodb/user-repository.js";

const generateS3Url = (fileKey) => {
  const baseUrl = process.env.AWS_S3_BASE_URL;
  return `${baseUrl}/${fileKey}`;
};

const createEnrollment = async (req, res) => {
  const userId = req.user.sub;
  const courseId = req.params.id;

  try {
    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const course = await CourseRepository.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const existingEnrollment = await EnrollmentRepository.findByUserAndCourse(
      userId,
      courseId,
    );
    if (existingEnrollment) {
      return res
        .status(400)
        .json({ error: "User is already enrolled in this course" });
    }

    let progress = req.body.progress ?? [];
    if (!Array.isArray(progress) || !progress.every(Number.isInteger)) {
      return res
        .status(400)
        .json({ error: "Progress must be an array of integers" });
    }

    const enrollment = await EnrollmentRepository.create({
      userId,
      courseId,
      courseTitle: course.title,
      coursePrice: course.price,
      courseImageKey: course.imageKey,
      progress,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json(enrollment);
  } catch (error) {
    console.error(error);
    if (error.name === "ConditionalCheckFailedException") {
      return res.status(400).json({ error: "Duplicate enrollment detected" });
    }
    res.status(500).json({ error: "Error creating course enrollment" });
  }
};

const getNumberOfEnrolledStudents = async (req, res) => {
  const courseId = req.params.id;

  if (!courseId) {
    return res.status(400).json({ message: "Invalid or missing courseId." });
  }

  try {
    const count = await EnrollmentRepository.countByCourse(courseId);

    if (count === 0) {
      return res
        .status(404)
        .json({ error: "No students are enrolled for this course" });
    }

    res.status(200).json({
      courseId,
      enrolledStudents: count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching enrolled students" });
  }
};

const getEnrolledCourses = async (req, res) => {
  const userId = req.user.sub;

  try {
    const enrollments = await EnrollmentRepository.findByUser(userId);

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ error: "No courses found for this user" });
    }

    const coursesWithUrls = enrollments.map((enrollment) => ({
      id: enrollment.courseId,
      title: enrollment.courseTitle,
      price: enrollment.coursePrice,
      imageKey: enrollment.courseImageKey,
      imageUrl: generateS3Url(enrollment.courseImageKey),
    }));

    const courseIds = enrollments.map((enrollment) => enrollment.courseId);

    res.status(200).json({
      coursesWithUrls,
      courseIds,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching enrolled courses" });
  }
};

const getInstructorRevenue = async (req, res) => {
  const instructorId = req.user.sub;
  if (!instructorId) {
    return res.status(400).json({ message: "Invalid or missing userId." });
  }

  try {
    const courses = await CourseRepository.findByInstructor(instructorId);

    if (!courses || courses.length === 0) {
      return res.status(404).json({ error: "No courses found for instructor" });
    }

    const revenueData = await EnrollmentRepository.getInstructorRevenue(
      instructorId,
      courses,
    );

    res.status(200).json({
      revenueData,
    });
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    res.status(500).json({ error: "Error fetching revenue data" });
  }
};

export {
  createEnrollment,
  getEnrolledCourses,
  getNumberOfEnrolledStudents,
  getInstructorRevenue,
};

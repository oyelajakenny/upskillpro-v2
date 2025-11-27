import { CourseRepository } from "../../models/dynamodb/course-repository.js";
import { UserRepository } from "../../models/dynamodb/user-repository.js";
import { CategoryRepository } from "../../models/dynamodb/category-repository.js";
import { EnrollmentRepository } from "../../models/dynamodb/enrollment-repository.js";

const generateS3Url = (fileKey) => {
  const baseUrl = process.env.AWS_S3_BASE_URL;
  return `${baseUrl}/${fileKey}`;
};

const createCourse = async (req, res) => {
  const instructorId = req.user.sub;
  const { title, description, price, imageKey, categoryId } = req.body;

  try {
    const instructor = await UserRepository.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      return res
        .status(403)
        .json({ message: "Instructor not found or invalid." });
    }

    // Validate categoryId if provided
    let categoryName = null;
    if (categoryId) {
      const category = await CategoryRepository.findById(categoryId);
      if (!category) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      categoryName = category.name;
    }

    const course = await CourseRepository.create({
      title,
      description,
      instructorId,
      instructorName: instructor.name,
      instructorEmail: instructor.email,
      imageKey,
      price,
      categoryId,
      categoryName,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating course." });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const { title, sortKey = "price", sortDir = "asc", categoryId } = req.query;

    const courses = await CourseRepository.findAll({
      sortBy: sortKey,
      sortDir,
      titleFilter: title,
      categoryId,
    });

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found" });
    }

    const coursesWithUrls = courses.map((course) => ({
      id: course.courseId,
      title: course.title,
      description: course.description,
      price: course.price,
      imageKey: course.imageKey,
      imageUrl: generateS3Url(course.imageKey),
      createdAt: course.createdAt,
      instructor: {
        id: course.instructorId,
        name: course.instructorName,
        email: course.instructorEmail,
      },
      categoryId: course.categoryId,
      categoryName: course.categoryName,
      averageRating: course.averageRating || 0,
      ratingCount: course.ratingCount || 0,
    }));

    res.status(200).json(coursesWithUrls);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

const getCoursesByInstructor = async (req, res) => {
  try {
    const instructorId = req.user.sub;
    const { categoryId } = req.query;

    if (!instructorId) {
      return res
        .status(404)
        .json({ message: "Instructor ID not found in token" });
    }

    let courses = await CourseRepository.findByInstructor(instructorId);

    // Filter by category if provided
    if (categoryId) {
      courses = courses.filter((course) => course.categoryId === categoryId);
    }

    if (!courses.length) {
      return res
        .status(404)
        .json({ message: "No courses found for this instructor" });
    }

    // Fetch enrollment count for each course
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        let enrolledCount = 0;
        try {
          const enrollments = await EnrollmentRepository.findByCourse(
            course.courseId
          );
          enrolledCount = enrollments.length;
        } catch (error) {
          console.error(
            `Error fetching enrollments for course ${course.courseId}:`,
            error
          );
          // Continue with 0 if error
        }

        return {
          id: course.courseId,
          title: course.title,
          description: course.description,
          imageKey: course.imageKey,
          imageUrl: generateS3Url(course.imageKey),
          createdAt: course.createdAt,
          categoryId: course.categoryId,
          categoryName: course.categoryName,
          averageRating: course.averageRating || 0,
          ratingCount: course.ratingCount || 0,
          enrolledCount: enrolledCount,
          rating: course.averageRating || 0, // Add rating field for compatibility
        };
      })
    );

    res.status(200).json(coursesWithData);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await CourseRepository.findByIdWithLectures(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const courseWithUrl = {
      id: course.courseId,
      title: course.title,
      description: course.description,
      price: course.price,
      imageKey: course.imageKey,
      imageUrl: generateS3Url(course.imageKey),
      createdAt: course.createdAt,
      instructor: {
        id: course.instructorId,
        name: course.instructorName,
        email: course.instructorEmail,
      },
      categoryId: course.categoryId,
      categoryName: course.categoryName,
      averageRating: course.averageRating || 0,
      ratingCount: course.ratingCount || 0,
      lectures: course.lectures.map((lecture) => ({
        id: lecture.lectureId,
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        createdAt: lecture.createdAt,
      })),
    };

    res.status(200).json(courseWithUrl);
  } catch (error) {
    console.error("Error fetching course by ID:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the course" });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId } = req.body;

    const course = await CourseRepository.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructorId !== req.user.sub) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this course" });
    }

    const updates = { title, description };

    // Validate and add category if provided
    if (categoryId) {
      const category = await CategoryRepository.findById(categoryId);
      if (!category) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      updates.categoryId = categoryId;
      updates.categoryName = category.name;
    }

    const updatedCourse = await CourseRepository.update(id, updates);

    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the course" });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.user.sub;

    // First, verify the course exists and belongs to the instructor
    const course = await CourseRepository.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify ownership
    if (course.instructorId !== instructorId) {
      return res.status(403).json({
        message: "You are not authorized to delete this course",
      });
    }

    // Delete the course and all related data
    await CourseRepository.delete(id);

    res.status(200).json({
      message: "Course deleted successfully",
      courseId: id,
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      error: "An error occurred while deleting the course",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export {
  createCourse,
  getCoursesByInstructor,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};

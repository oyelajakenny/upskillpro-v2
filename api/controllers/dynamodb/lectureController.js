import { LectureRepository } from "../../models/dynamodb/lecture-repository.js";
import { CourseRepository } from "../../models/dynamodb/course-repository.js";

const generateS3Url = (fileKey) => {
  const baseUrl = process.env.AWS_S3_BASE_URL;
  return `${baseUrl}/${fileKey}`;
};

const createLecture = async (req, res) => {
  const courseId = req.params.id;

  if (!courseId) {
    return res.status(404).json({ message: "courseID is not found" });
  }

  const { title, videoUrl, durationSeconds } = req.body;

  try {
    const course = await CourseRepository.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const lecture = await LectureRepository.create({
      courseId,
      title,
      videoUrl,
      createdAt: new Date().toISOString(),
      durationSeconds:
        typeof durationSeconds === "number" && durationSeconds >= 0
          ? durationSeconds
          : null,
    });

    res.status(201).json(lecture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding lecture." });
  }
};

const getLecturesByCourseId = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await CourseRepository.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course does not exist" });
    }

    const lectures = await LectureRepository.findByCourse(courseId);

    if (!lectures || lectures.length === 0) {
      return res
        .status(404)
        .json({ message: "No lectures found for this course" });
    }

    const lecturesWithUrls = lectures.map((lecture) => ({
      id: lecture.lectureId,
      title: lecture.title,
      videoUrl: lecture.videoUrl,
      videoURL: generateS3Url(lecture.videoUrl),
      durationSeconds: lecture.durationSeconds ?? null,
      createdAt: lecture.createdAt,
    }));

    res.status(200).json(lecturesWithUrls);
  } catch (error) {
    console.error("Error fetching lectures:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createLecture, getLecturesByCourseId };

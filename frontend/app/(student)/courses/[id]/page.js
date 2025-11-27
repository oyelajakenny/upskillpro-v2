"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import VideoPlayer from "@/app/student-dashboard/components/VideoPlayer";
import Image from "next/image";
import EnrollButton from "@/app/_components/HomePageComponents/EnrollButton";
import { FaChalkboardTeacher } from "react-icons/fa";
import { DollarSign, Trash2 } from "lucide-react";
import SocialButtons from "@/app/_components/HomePageComponents/SocialButtons";
import RatingDisplay from "@/components/RatingDisplay";
import RatingInput from "@/components/RatingInput";
import ReviewList from "@/components/ReviewList";
import {
  submitRating,
  getMyRating,
  getCourseRatings,
  deleteRating,
} from "@/lib/api/ratings";
import { toast } from "react-toastify";

const CoursePage = () => {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const [course, setCourse] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [myRating, setMyRating] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourseByID = async () => {
    if (!id) {
      setError("Invalid Course ID");
      setLoading(false);
      return;
    }
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${id}`;
      const apiResponse = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
      });

      if (apiResponse.status === 404) {
        setCourse({});
        setLoading(false);
        return;
      }
      if (apiResponse.ok) {
        const course = await apiResponse.json();
        setCourse(course);
        setLoading(false);
      } else {
        const errorText = await apiResponse.json();
        console.error("Error details:", errorText.message);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching course:", error.message);
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/enroll/all`;
      const apiResponse = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log("Enrolled courses data:", data);
        console.log("Course IDs:", data.courseIds);
        setEnrolledCourses(data.courseIds || []);
      } else {
        console.error("Failed to fetch enrolled courses");
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error.message);
      setEnrolledCourses([]);
    }
  };

  // Fetch user's existing rating
  const fetchMyRating = async () => {
    if (!isAuthenticated || !token) return;

    try {
      const rating = await getMyRating(id, token);
      setMyRating(rating);
    } catch (error) {
      console.error("Error fetching user rating:", error);
      // Don't show error toast for missing rating (404)
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCourseByID();
    fetchEnrolledCourses();
    fetchMyRating();
  }, [id, isAuthenticated, token]);

  // Handle rating submission
  const handleSubmitRating = async (rating, review) => {
    try {
      const result = await submitRating(id, rating, review, token);
      setMyRating(result);
      toast.success(
        myRating
          ? "Rating updated successfully!"
          : "Rating submitted successfully!"
      );
      // Refresh course data to update aggregates
      await fetchCourseByID();
    } catch (error) {
      console.error("Error submitting rating:", error);
      throw error; // Re-throw to let RatingInput handle the error display
    }
  };

  // Handle rating deletion
  const handleDeleteRating = async () => {
    setIsDeleting(true);
    try {
      await deleteRating(id, token);
      setMyRating(null);
      setShowDeleteConfirm(false);
      toast.success("Rating deleted successfully!");
      // Refresh course data to update aggregates
      await fetchCourseByID();
    } catch (error) {
      console.error("Error deleting rating:", error);
      toast.error("Failed to delete rating. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch reviews wrapper for ReviewList component
  const fetchReviews = async (courseId, limit, lastKey) => {
    return getCourseRatings(courseId, { limit, lastKey });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!course) {
    return <div>No course data found.</div>;
  }

  // Check enrollment - handle both string and number comparisons
  const isEnrolled = enrolledCourses.some(
    (courseId) => String(courseId) === String(id)
  );

  console.log("Checking enrollment:");
  console.log("- Current course ID:", id, typeof id);
  console.log("- Enrolled courses:", enrolledCourses);
  console.log("- Is enrolled:", isEnrolled);

  return (
    <div className="bg-gray-100">
      <div className="width-full bg-gradient-to-r from-black to-gray-500 shadow-lg ">
        <div className="container mx-auto px-5 py-3 shadow-xl ">
          <h3 className="text-gray-100 text-xl font-bold mb-4 lg:text-4xl">
            {course.title}
          </h3>
          <p className=" flex items-center gap-2">
            <span className="text-gray-300 font-medium text-xl flex items-center gap-2">
              <FaChalkboardTeacher />
              Course by:
            </span>
            <span className="text-white text-2xl">
              {course.instructor?.name}
            </span>
          </p>
          <div className="mt-2">
            <span
              className={`${
                course.categoryName ? "bg-purple-600" : "bg-gray-500"
              } text-white px-3 py-1 text-sm font-semibold rounded-full`}
            >
              {course.categoryName || "Uncategorized"}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto">
        <div className="leading-loose grid lg:grid-cols-3 md:gap-3">
          <div className="p-3 col-span-2 px-4 border">
            <div className="bg-white p-5 rounded-lg shadow-md mb-5 flex justify-center">
              <VideoPlayer
                url="/api.mp4"
                onProgressUpdate={() => {}}
                progressData={{}}
                width={900}
                height={600}
                showControls={true}
              />
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md mb-5">
              <p className="text-gray-600 mb-3">{course.description}</p>
            </div>

            {/* Rating Display Section */}
            <div className="bg-white p-5 rounded-lg shadow-md mb-5">
              <h3 className="text-2xl font-semibold mb-4">Course Rating</h3>
              <RatingDisplay
                averageRating={course.averageRating || 0}
                ratingCount={course.ratingCount || 0}
                size="large"
              />
            </div>

            {/* Rating Input Section - Only for enrolled students */}
            {isAuthenticated && isEnrolled && (
              <div className="bg-white p-5 rounded-lg shadow-md mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-semibold">
                    {myRating ? "Your Rating" : "Rate This Course"}
                  </h3>
                  {myRating && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Rating
                    </button>
                  )}
                </div>
                <RatingInput
                  initialRating={myRating?.rating || 0}
                  initialReview={myRating?.review || ""}
                  onSubmit={handleSubmitRating}
                  disabled={isDeleting}
                />
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-xl font-semibold mb-4">Delete Rating</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete your rating? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteRating}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List Section */}
            <div className="bg-white p-5 rounded-lg shadow-md mb-5">
              <ReviewList
                courseId={id}
                pageSize={10}
                fetchReviews={fetchReviews}
              />
            </div>

            <div className="bg-white p-5 rounded-lg shadow-md">
              <h4 className="text-1xl font-semibold mt-4 bg-green-100 text-green-600 w-fit px-5">
                {course.lectures?.length} Lectures
              </h4>
              {course.lectures?.map((lecture, lectureIndex) => (
                <div key={lectureIndex} className="my-5 p-4 border">
                  <h5 className="text-xl font-medium">{lecture.title}</h5>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="hidden md:inline-block w-full bg-white p-6 rounded-lg border">
              <Image
                src={course.imageUrl || null}
                alt={`image of ${course.title}`}
                width={500}
                height={500}
                className="object-contain"
              />
              <div className="my-4">
                <RatingDisplay
                  averageRating={course.averageRating || 0}
                  ratingCount={course.ratingCount || 0}
                  size="medium"
                />
              </div>
              <h3 className="text-4xl font-bold text-green-700 my-4 flex items-center">
                {course.price} Dkk
              </h3>
              <EnrollButton
                courseId={id}
                setLoading={setLoading}
                isEnrolled={isEnrolled}
              />
            </div>
            <div>
              <SocialButtons />
            </div>
          </div>
          <div className="border border-gray-300 rounded-md leading-loose lg:col-span-1">
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white p-2 shadow-md">
              <h3 className="text-4xl font-bold text-green-700 my-4 flex items-center">
                {course.price} Kr
              </h3>
              <EnrollButton
                courseId={id}
                setLoading={setLoading}
                isEnrolled={isEnrolled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;

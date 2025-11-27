"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RatingStats from "@/components/RatingStats";
import RatingDisplay from "@/components/RatingDisplay";
import { getInstructorRatings } from "@/lib/api/ratings";
import { Star, TrendingUp, Users } from "lucide-react";

/**
 * InstructorRatingAnalytics Component
 *
 * Displays comprehensive rating analytics for instructor's courses.
 * Shows overall stats, per-course ratings, and recent reviews.
 */
const InstructorRatingAnalytics = () => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getInstructorRatings(token);
        setRatingsData(data);
      } catch (err) {
        console.error("Error fetching instructor ratings:", err);
        setError("Failed to load rating analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [token]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rating Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rating Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (
    !ratingsData ||
    !ratingsData.courses ||
    ratingsData.courses.length === 0
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rating Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No rating data available yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Rating analytics will appear here once students start rating your
              courses.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall stats
  const totalRatings = ratingsData.courses.reduce(
    (sum, course) => sum + (course.ratingCount || 0),
    0
  );
  const averageRating =
    totalRatings > 0
      ? ratingsData.courses.reduce(
          (sum, course) =>
            sum + (course.averageRating || 0) * (course.ratingCount || 0),
          0
        ) / totalRatings
      : 0;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Rating Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ratings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalRatings}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Courses with Ratings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ratingsData.courses.filter((c) => c.ratingCount > 0).length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Course Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Course Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {ratingsData.courses.map((course) => (
              <div
                key={course.courseId}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.courseTitle}
                    </h3>
                    <RatingDisplay
                      averageRating={course.averageRating || 0}
                      ratingCount={course.ratingCount || 0}
                      size="medium"
                    />
                  </div>
                  <button
                    onClick={() =>
                      setSelectedCourse(
                        selectedCourse === course.courseId
                          ? null
                          : course.courseId
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedCourse === course.courseId
                      ? "Hide Details"
                      : "View Details"}
                  </button>
                </div>

                {selectedCourse === course.courseId && (
                  <div className="mt-4 space-y-4">
                    {/* Rating Distribution */}
                    <RatingStats
                      distribution={course.distribution || {}}
                      totalRatings={course.ratingCount || 0}
                      averageRating={course.averageRating || 0}
                    />

                    {/* Recent Reviews */}
                    {course.recentReviews &&
                      course.recentReviews.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">
                            Recent Reviews
                          </h4>
                          <div className="space-y-3">
                            {course.recentReviews.map((review, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 p-3 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900">
                                    {review.userName}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {review.review && (
                                  <p className="text-sm text-gray-700">
                                    {review.review}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    review.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorRatingAnalytics;

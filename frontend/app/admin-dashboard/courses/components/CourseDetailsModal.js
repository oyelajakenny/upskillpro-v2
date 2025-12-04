"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextDisplay from "@/components/RichTextDisplay";
import {
  BookOpen,
  User,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Star,
  Eye,
  Download,
  ExternalLink,
  Tag,
  BarChart3,
} from "lucide-react";

const CourseDetailsModal = ({ course, isOpen, onClose }) => {
  const { token } = useSelector((state) => state.auth);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch detailed course information
  const fetchCourseDetails = async (courseId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${courseId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch course details");
      }

      const result = await response.json();
      setCourseDetails(result.data);
    } catch (error) {
      console.error("Error fetching course details:", error);
      setError(error.message);
      // Set mock detailed data for development
      setCourseDetails({
        ...course,
        description: course?.description || "Detailed course description...",
        syllabus: [
          { title: "Introduction to the Course", duration: "30 min" },
          { title: "Core Concepts", duration: "2 hours" },
          { title: "Practical Examples", duration: "3 hours" },
          { title: "Advanced Topics", duration: "2.5 hours" },
        ],
        requirements: [
          "Basic programming knowledge",
          "Computer with internet connection",
          "Willingness to learn",
        ],
        learningOutcomes: [
          "Master the core concepts",
          "Build practical projects",
          "Understand advanced techniques",
          "Apply knowledge in real scenarios",
        ],
        enrollmentHistory: [
          { date: "2024-01-15", count: 25 },
          { date: "2024-01-16", count: 45 },
          { date: "2024-01-17", count: 67 },
        ],
        recentReviews: [
          {
            id: 1,
            studentName: "Alice Johnson",
            rating: 5,
            comment: "Excellent course! Very well structured.",
            date: "2024-01-20",
          },
          {
            id: 2,
            studentName: "Bob Smith",
            rating: 4,
            comment: "Good content, could use more examples.",
            date: "2024-01-19",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course?.courseId) {
      fetchCourseDetails(course.courseId);
    }
  }, [isOpen, course?.courseId, token]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
      draft: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.draft;
  };

  // Render star rating
  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Course Details
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">
              Loading course details...
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-800">Error: {error}</span>
          </div>
        )}

        {courseDetails && (
          <div className="space-y-6">
            {/* Course Header */}
            <div className="flex items-start space-x-4">
              <div className="h-24 w-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {courseDetails.thumbnailUrl ? (
                  <img
                    src={courseDetails.thumbnailUrl}
                    alt={courseDetails.title}
                    className="h-24 w-32 rounded-lg object-cover"
                  />
                ) : (
                  <BookOpen className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {courseDetails.title}
                </h2>
                <div className="mb-3">
                  <RichTextDisplay
                    content={courseDetails.description}
                    className="text-sm"
                    fallbackText="No description available."
                  />
                </div>
                <div className="flex items-center space-x-4 mb-3">
                  <Badge className={getStatusBadgeColor(courseDetails.status)}>
                    {courseDetails.status}
                  </Badge>
                  <Badge variant="outline">{courseDetails.level}</Badge>
                  <Badge variant="outline">{courseDetails.categoryName}</Badge>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {courseDetails.instructorName}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {courseDetails.duration}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(courseDetails.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Course Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(courseDetails.price)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Enrollments</p>
                      <p className="text-lg font-semibold">
                        {courseDetails.enrollmentCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="text-lg font-semibold">
                        {courseDetails.rating > 0
                          ? courseDetails.rating.toFixed(1)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Reviews</p>
                      <p className="text-lg font-semibold">
                        {courseDetails.reviewCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Syllabus */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Syllabus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courseDetails.syllabus?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium">{item.title}</span>
                        <span className="text-sm text-gray-600">
                          {item.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Requirements & Outcomes */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {courseDetails.requirements?.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-sm">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Learning Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {courseDetails.learningOutcomes?.map((outcome, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span className="text-sm">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Reviews */}
            {courseDetails.recentReviews?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseDetails.recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">
                              {review.studentName}
                            </span>
                            {renderStarRating(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.date)}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Course Page
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Details
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsModal;

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  BookOpen,
  Star,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";

const InstructorPerformanceModal = ({ instructor, isOpen, onClose }) => {
  const { token } = useSelector((state) => state.auth);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch detailed performance data
  const fetchPerformanceData = async (instructorId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/instructors/${instructorId}/performance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch performance data");
      }

      const result = await response.json();
      setPerformanceData(result.data);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setError(error.message);
      // Set mock detailed data for development
      setPerformanceData({
        ...instructor,
        courses: [
          {
            courseId: "course-1",
            title: "Advanced React Development",
            status: "approved",
            students: 456,
            rating: 4.8,
            reviews: 89,
            revenue: 6840.0,
            createdAt: "2023-09-15T10:00:00Z",
            lastUpdated: "2024-01-15T14:30:00Z",
          },
          {
            courseId: "course-2",
            title: "React Hooks Masterclass",
            status: "approved",
            students: 234,
            rating: 4.6,
            reviews: 45,
            revenue: 3510.0,
            createdAt: "2023-11-20T09:00:00Z",
            lastUpdated: "2024-01-10T11:15:00Z",
          },
          {
            courseId: "course-3",
            title: "Next.js Complete Guide",
            status: "pending",
            students: 0,
            rating: 0,
            reviews: 0,
            revenue: 0,
            createdAt: "2024-01-18T16:00:00Z",
            lastUpdated: "2024-01-18T16:00:00Z",
          },
        ],
        monthlyStats: [
          { month: "Oct 2023", students: 89, revenue: 1335.0, courses: 1 },
          { month: "Nov 2023", students: 156, revenue: 2340.0, courses: 1 },
          { month: "Dec 2023", students: 203, revenue: 3045.0, courses: 0 },
          { month: "Jan 2024", students: 178, revenue: 2670.0, courses: 1 },
        ],
        achievements: [
          {
            title: "Top Rated Instructor",
            description: "Maintained 4.5+ rating for 6 months",
            date: "2024-01-01",
          },
          {
            title: "1000+ Students",
            description: "Reached 1000 total students milestone",
            date: "2023-12-15",
          },
          {
            title: "Course Excellence",
            description: "Course featured in top recommendations",
            date: "2023-11-30",
          },
        ],
        recentActivity: [
          {
            action: "Course Updated",
            description: "Updated React Hooks Masterclass content",
            date: "2024-01-20T10:00:00Z",
          },
          {
            action: "New Course Submitted",
            description: "Submitted Next.js Complete Guide for review",
            date: "2024-01-18T16:00:00Z",
          },
          {
            action: "Student Interaction",
            description: "Responded to 15 student questions",
            date: "2024-01-17T14:30:00Z",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && instructor?.instructorId) {
      fetchPerformanceData(instructor.instructorId);
    }
  }, [isOpen, instructor?.instructorId, token]);

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
      month: "short",
      day: "numeric",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
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

  if (!instructor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Instructor Performance Details
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">
              Loading performance data...
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-800">Error: {error}</span>
          </div>
        )}

        {performanceData && (
          <div className="space-y-6">
            {/* Instructor Header */}
            <div className="flex items-start space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                {performanceData.profilePicture ? (
                  <img
                    src={performanceData.profilePicture}
                    alt={performanceData.name}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <span className="text-xl font-medium text-gray-600">
                    {performanceData.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {performanceData.name}
                </h2>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-1" />
                    <span className="text-sm">{performanceData.email}</span>
                  </div>
                  <Badge
                    className={getStatusBadgeColor(performanceData.status)}
                  >
                    {performanceData.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {formatDate(performanceData.joinedAt)}
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {performanceData.totalCourses} courses
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {performanceData.totalStudents} students
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(performanceData.totalRevenue)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(performanceData.revenueThisMonth)} this
                        month
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
                      <p className="text-sm text-gray-600">Average Rating</p>
                      <p className="text-lg font-semibold">
                        {performanceData.averageRating.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {performanceData.totalReviews} reviews
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Course Approval</p>
                      <p className="text-lg font-semibold">
                        {performanceData.totalCourses > 0
                          ? Math.round(
                              (performanceData.approvedCourses /
                                performanceData.totalCourses) *
                                100
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-gray-500">
                        {performanceData.approvedCourses}/
                        {performanceData.totalCourses} approved
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Monthly Growth</p>
                      <p className="text-lg font-semibold">
                        +{performanceData.studentsThisMonth}
                      </p>
                      <p className="text-xs text-gray-500">
                        new students this month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Courses and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {performanceData.courses?.map((course) => (
                      <div
                        key={course.courseId}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">
                            {course.title}
                          </h4>
                          <Badge className={getStatusBadgeColor(course.status)}>
                            {course.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {course.students}
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            {course.rating > 0
                              ? course.rating.toFixed(1)
                              : "N/A"}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(course.revenue)}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {formatDate(course.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {performanceData.recentActivity?.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.action}
                          </p>
                          <p className="text-xs text-gray-600">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(activity.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            {performanceData.achievements?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {performanceData.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="flex items-center mb-2">
                          <Award className="h-5 w-5 text-yellow-600 mr-2" />
                          <h4 className="font-medium text-sm">
                            {achievement.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(achievement.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Performance Chart */}
            {performanceData.monthlyStats?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Monthly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>New Students</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>New Courses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceData.monthlyStats.map((stat, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {stat.month}
                            </TableCell>
                            <TableCell>{stat.students}</TableCell>
                            <TableCell>
                              {formatCurrency(stat.revenue)}
                            </TableCell>
                            <TableCell>{stat.courses}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                View Profile
              </Button>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Contact Instructor
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstructorPerformanceModal;

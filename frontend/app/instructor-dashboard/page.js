"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Eye,
  Edit,
  Star,
  Clock,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const InstructorDashboard = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchInstructorData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/courses/all`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const coursesData = await response.json();
          setCourses(coursesData);

          // Calculate stats
          const totalCourses = coursesData.length;
          const totalStudents = coursesData.reduce(
            (sum, course) => sum + (course.enrolledCount || 0),
            0
          );
          const totalRevenue = coursesData.reduce(
            (sum, course) => sum + (course.revenue || 0),
            0
          );
          const averageRating =
            coursesData.reduce((sum, course) => sum + (course.rating || 0), 0) /
            (totalCourses || 1);

          setStats({
            totalCourses,
            totalStudents,
            totalRevenue,
            averageRating: averageRating.toFixed(1),
          });
        }
      } catch (error) {
        console.error("Error fetching instructor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back,{" "}
          <span className="text-blue-600">{user?.name || "Instructor"}</span>!
          👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your courses today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {stats.averageRating}
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 ml-1" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Course rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/instructor-dashboard/add-course">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-500">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Plus className="h-12 w-12 text-blue-600 mb-2" />
                <p className="font-semibold text-gray-900">Create New Course</p>
                <p className="text-xs text-gray-500 mt-1">Start teaching</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/instructor-dashboard/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <BarChart3 className="h-12 w-12 text-green-600 mb-2" />
                <p className="font-semibold text-gray-900">View Analytics</p>
                <p className="text-xs text-gray-500 mt-1">Track performance</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/instructor-dashboard/ratings">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Star className="h-12 w-12 text-yellow-600 mb-2" />
                <p className="font-semibold text-gray-900">Course Ratings</p>
                <p className="text-xs text-gray-500 mt-1">Student feedback</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/instructor-dashboard/profile">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-purple-600 mb-2" />
                <p className="font-semibold text-gray-900">Edit Profile</p>
                <p className="text-xs text-gray-500 mt-1">Update info</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* My Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <Link href="/instructor-dashboard/add-course">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first course and start teaching
              </p>
              <Link href="/instructor-dashboard/add-course">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-400 to-blue-600">
                      <BookOpen className="h-16 w-16 text-white" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-white text-gray-900">
                    {course.status || "Active"}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.enrolledCount || 0} students
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
                      {course.rating || "N/A"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/instructor-dashboard/courses/${course.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.id}`} className="flex-1">
                        <Button className="w-full" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                    <Link
                      href={`/instructor-dashboard/courses/${course.id}/add-lecture`}
                      className="block"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Lecture
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;

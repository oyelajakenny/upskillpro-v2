"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, Award, TrendingUp, Play } from "lucide-react";
import LearningLoading from "@/app/_components/HomePageComponents/MyLearningLoading";
import ProgressCard from "@/app/student-dashboard/components/ProgressCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StudentDashboard = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    inProgress: 0,
    completedLessons: 0,
    totalLearningSeconds: 0,
  });

  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        const apiResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/enroll/my-learning`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (apiResponse.status === 404) {
          setEnrolledCourses([]);
          return;
        }

        if (apiResponse.ok) {
          const courses = await apiResponse.json();
          const normalizedCourses = courses.map((course) => ({
            ...course,
            progress: Number(course.progress ?? 0),
          }));
          setEnrolledCourses(normalizedCourses);

          // Calculate stats from enriched API data
          const totalCourses = normalizedCourses.length;
          const inProgress = normalizedCourses.filter(
            (c) => c.progress > 0 && c.progress < 100
          ).length;
          const completedLessons = normalizedCourses.reduce(
            (sum, c) => sum + (c.completedLectures || 0),
            0
          );
          const totalLearningSeconds = normalizedCourses.reduce(
            (sum, c) => sum + (c.completedDurationSeconds || 0),
            0
          );

          setStats({
            totalCourses,
            inProgress,
            completedLessons,
            totalLearningSeconds,
          });
        } else {
          const errorText = await apiResponse.json();
          console.error("Error details:", errorText);
          setError(errorText.message || "Failed to fetch courses");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [isAuthenticated, router]);

  const formatLearningTime = (seconds) => {
    if (!seconds || seconds <= 0) {
      return "0h";
    }
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return <LearningLoading />;
  }

  if (error) {
    return (
      <div className="container mx-auto my-10 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-10 px-4 md:px-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back,{" "}
          <span className="text-blue-600">{user?.name || "Student"}</span> 🎉
        </h1>
        <p className="text-gray-600">
          Continue your learning journey and track your progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">Enrolled courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              In Progress
            </CardTitle>
            <Play className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-gray-500 mt-1">Active learning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Lessons
            </CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedLessons}
            </div>
            <p className="text-xs text-gray-500 mt-1">Lessons finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Learning Time
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatLearningTime(stats.totalLearningSeconds)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total learning time</p>
          </CardContent>
        </Card>
      </div>

      {/* My Learning Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Learning</h2>
          <Link
            href="/courses"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
          >
            Browse More Courses
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start your learning journey by enrolling in a course
              </p>
              <Link href="/courses">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Explore Courses
                </button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrolledCourses.map((course, index) => (
              <ProgressCard key={course.courseId || index} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* Continue Learning Section - Show courses in progress */}
      {stats.inProgress > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Continue Learning
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses
              .filter((course) => course.progress > 0 && course.progress < 100)
              .slice(0, 3)
              .map((course, index) => (
                <ProgressCard key={course.courseId || index} course={course} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

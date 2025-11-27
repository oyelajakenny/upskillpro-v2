"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Star, Users, TrendingUp } from "lucide-react";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const CoursePerformanceChart = ({ data }) => {
  // Process data for chart
  const processChartData = () => {
    if (!data) {
      // Return sample data if no data available
      return {
        labels: ["Published", "Draft", "Under Review", "Rejected"],
        datasets: [
          {
            label: "Course Status",
            data: [65, 15, 12, 8],
            backgroundColor: [
              "rgba(34, 197, 94, 0.8)", // Green for published
              "rgba(59, 130, 246, 0.8)", // Blue for draft
              "rgba(245, 158, 11, 0.8)", // Yellow for under review
              "rgba(239, 68, 68, 0.8)", // Red for rejected
            ],
            borderColor: [
              "rgb(34, 197, 94)",
              "rgb(59, 130, 246)",
              "rgb(245, 158, 11)",
              "rgb(239, 68, 68)",
            ],
            borderWidth: 2,
          },
        ],
      };
    }

    // Process real data - assuming data structure includes course status counts
    const statusCounts = {
      published: data.activeCourses || 0,
      draft: data.draftCourses || 0,
      review: data.pendingCourses || 0,
      rejected: data.rejectedCourses || 0,
    };

    return {
      labels: ["Published", "Draft", "Under Review", "Rejected"],
      datasets: [
        {
          label: "Course Status",
          data: [
            statusCounts.published,
            statusCounts.draft,
            statusCounts.review,
            statusCounts.rejected,
          ],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(59, 130, 246)",
            "rgb(245, 158, 11)",
            "rgb(239, 68, 68)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce(
              (sum, value) => sum + value,
              0
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "60%",
  };

  const chartData = processChartData();

  // Calculate course performance metrics
  const calculateCourseMetrics = () => {
    if (!data) {
      return {
        totalCourses: "156",
        publishedRate: "65%",
        averageRating: "4.2",
        totalEnrollments: "2,847",
      };
    }

    const total = data.totalCourses || 0;
    const published = data.activeCourses || 0;
    const publishedRate =
      total > 0 ? ((published / total) * 100).toFixed(1) : "0";

    return {
      totalCourses: total.toLocaleString(),
      publishedRate: `${publishedRate}%`,
      averageRating: data.averageRating?.toFixed(1) || "0.0",
      totalEnrollments: (data.totalEnrollments || 0).toLocaleString(),
    };
  };

  const metrics = calculateCourseMetrics();

  // Sample top performing courses data
  const topCourses = [
    {
      title: "Advanced React Development",
      enrollments: 1234,
      rating: 4.8,
      revenue: 15420,
    },
    {
      title: "Python for Data Science",
      enrollments: 987,
      rating: 4.6,
      revenue: 12340,
    },
    {
      title: "Digital Marketing Mastery",
      enrollments: 756,
      rating: 4.5,
      revenue: 9870,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
          Course Performance & Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doughnut Chart */}
          <div className="h-64">
            <Doughnut data={chartData} options={chartOptions} />
          </div>

          {/* Course Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.totalCourses}
                </div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.publishedRate}
                </div>
                <div className="text-sm text-gray-600">Published Rate</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                  <Star className="h-5 w-5 mr-1" />
                  {metrics.averageRating}
                </div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.totalEnrollments}
                </div>
                <div className="text-sm text-gray-600">Enrollments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Courses */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Top Performing Courses
          </h4>
          <div className="space-y-3">
            {topCourses.map((course, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{course.title}</h5>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {course.enrollments.toLocaleString()} students
                    </span>
                    <span className="flex items-center">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {course.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    ${course.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course Insights */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Course Insights</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              • {metrics.publishedRate} of courses are currently published and
              active
            </p>
            <p>• Average course rating is {metrics.averageRating} out of 5.0</p>
            <p>• Technology courses show the highest enrollment rates</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoursePerformanceChart;

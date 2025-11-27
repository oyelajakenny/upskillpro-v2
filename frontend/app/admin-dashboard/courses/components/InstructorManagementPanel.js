"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Users,
  BookOpen,
  Star,
  DollarSign,
  TrendingUp,
  Eye,
  BarChart3,
  Award,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import InstructorPerformanceModal from "./InstructorPerformanceModal";

const InstructorManagementPanel = () => {
  const { token } = useSelector((state) => state.auth);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  // Fetch instructors data
  const fetchInstructors = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/instructors/performance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch instructor data");
      }

      const result = await response.json();
      setInstructors(result.data.instructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      setError(error.message);
      // Set mock data for development
      setInstructors([
        {
          instructorId: "instructor-1",
          name: "John Smith",
          email: "john.smith@example.com",
          profilePicture: null,
          joinedAt: "2023-06-15T10:00:00Z",
          status: "active",
          totalCourses: 8,
          approvedCourses: 7,
          pendingCourses: 1,
          rejectedCourses: 0,
          totalStudents: 1245,
          totalRevenue: 15670.5,
          averageRating: 4.7,
          totalReviews: 234,
          coursesThisMonth: 2,
          studentsThisMonth: 89,
          revenueThisMonth: 2340.0,
          topCourse: {
            title: "Advanced React Development",
            students: 456,
            rating: 4.8,
          },
          recentActivity: "Published new course 2 days ago",
        },
        {
          instructorId: "instructor-2",
          name: "Jane Doe",
          email: "jane.doe@example.com",
          profilePicture: null,
          joinedAt: "2023-08-20T14:30:00Z",
          status: "active",
          totalCourses: 5,
          approvedCourses: 4,
          pendingCourses: 0,
          rejectedCourses: 1,
          totalStudents: 892,
          totalRevenue: 12340.75,
          averageRating: 4.5,
          totalReviews: 167,
          coursesThisMonth: 0,
          studentsThisMonth: 45,
          revenueThisMonth: 1890.25,
          topCourse: {
            title: "Python for Data Science",
            students: 345,
            rating: 4.6,
          },
          recentActivity: "Updated course content 1 week ago",
        },
        {
          instructorId: "instructor-3",
          name: "Bob Wilson",
          email: "bob.wilson@example.com",
          profilePicture: null,
          joinedAt: "2023-11-10T09:15:00Z",
          status: "pending",
          totalCourses: 2,
          approvedCourses: 1,
          pendingCourses: 1,
          rejectedCourses: 0,
          totalStudents: 123,
          totalRevenue: 1890.0,
          averageRating: 4.2,
          totalReviews: 28,
          coursesThisMonth: 1,
          studentsThisMonth: 23,
          revenueThisMonth: 450.0,
          topCourse: {
            title: "Machine Learning Basics",
            students: 89,
            rating: 4.2,
          },
          recentActivity: "Submitted course for review 3 days ago",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchInstructors();
  }, [token]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter instructors based on search
  const filteredInstructors = instructors.filter(
    (instructor) =>
      instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle view performance
  const handleViewPerformance = (instructor) => {
    setSelectedInstructor(instructor);
    setShowPerformanceModal(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchInstructors();
  };

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

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      suspended: "bg-red-100 text-red-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.inactive;
  };

  // Get performance indicator
  const getPerformanceIndicator = (instructor) => {
    const approvalRate =
      instructor.totalCourses > 0
        ? (instructor.approvedCourses / instructor.totalCourses) * 100
        : 0;

    if (approvalRate >= 90 && instructor.averageRating >= 4.5) {
      return { label: "Excellent", color: "text-green-600", icon: Award };
    } else if (approvalRate >= 75 && instructor.averageRating >= 4.0) {
      return { label: "Good", color: "text-blue-600", icon: TrendingUp };
    } else if (approvalRate >= 50 && instructor.averageRating >= 3.5) {
      return { label: "Average", color: "text-yellow-600", icon: BarChart3 };
    } else {
      return {
        label: "Needs Improvement",
        color: "text-red-600",
        icon: AlertCircle,
      };
    }
  };

  // Calculate totals
  const totalInstructors = instructors.length;
  const activeInstructors = instructors.filter(
    (i) => i.status === "active"
  ).length;
  const totalRevenue = instructors.reduce((sum, i) => sum + i.totalRevenue, 0);
  const totalStudents = instructors.reduce(
    (sum, i) => sum + i.totalStudents,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Instructor Management
          </h2>
          <p className="text-gray-600">
            Monitor instructor performance and manage instructor accounts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Instructors</p>
                <p className="text-lg font-semibold">{totalInstructors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Active Instructors</p>
                <p className="text-lg font-semibold">{activeInstructors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-lg font-semibold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search instructors by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Instructor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-800">Error: {error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">
                Loading instructor data...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstructors.map((instructor) => {
                    const performance = getPerformanceIndicator(instructor);
                    const PerformanceIcon = performance.icon;

                    return (
                      <TableRow key={instructor.instructorId}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {instructor.profilePicture ? (
                                <img
                                  src={instructor.profilePicture}
                                  alt={instructor.name}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-600">
                                  {instructor.name?.charAt(0)?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {instructor.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {instructor.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeColor(instructor.status)}
                          >
                            {instructor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {instructor.totalCourses} total
                            </p>
                            <p className="text-gray-500">
                              {instructor.approvedCourses} approved
                            </p>
                            {instructor.pendingCourses > 0 && (
                              <p className="text-yellow-600">
                                {instructor.pendingCourses} pending
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {instructor.totalStudents}
                            </p>
                            <p className="text-gray-500">
                              +{instructor.studentsThisMonth} this month
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {formatCurrency(instructor.totalRevenue)}
                            </p>
                            <p className="text-gray-500">
                              {formatCurrency(instructor.revenueThisMonth)} this
                              month
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="font-medium">
                              {instructor.averageRating.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              ({instructor.totalReviews})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <PerformanceIcon
                              className={`h-4 w-4 mr-1 ${performance.color}`}
                            />
                            <span
                              className={`text-sm font-medium ${performance.color}`}
                            >
                              {performance.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(instructor.joinedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPerformance(instructor)}
                            title="View Performance Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredInstructors.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm
                      ? "No instructors found matching your search"
                      : "No instructors found"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructor Performance Modal */}
      <InstructorPerformanceModal
        instructor={selectedInstructor}
        isOpen={showPerformanceModal}
        onClose={() => {
          setShowPerformanceModal(false);
          setSelectedInstructor(null);
        }}
      />
    </div>
  );
};

export default InstructorManagementPanel;

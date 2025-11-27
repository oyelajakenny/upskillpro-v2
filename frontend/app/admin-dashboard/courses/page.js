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
  BookOpen,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  MoreHorizontal,
  Star,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  Flag,
  Tag,
} from "lucide-react";
import CourseDetailsModal from "./components/CourseDetailsModal";
import CourseApprovalModal from "./components/CourseApprovalModal";
import CourseEditModal from "./components/CourseEditModal";
import BulkCourseOperationsModal from "./components/BulkCourseOperationsModal";
import ContentModerationPanel from "./components/ContentModerationPanel";
import InstructorManagementPanel from "./components/InstructorManagementPanel";
import CategoryManagementPanel from "./components/CategoryManagementPanel";
import { toast } from "react-hot-toast";

const CourseManagementPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("courses");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    lastEvaluatedKey: null,
    hasMore: false,
  });

  // Tab configuration
  const tabs = [
    {
      id: "courses",
      label: "Course Management",
      icon: BookOpen,
      description: "Manage courses and approvals",
    },
    {
      id: "moderation",
      label: "Content Moderation",
      icon: Flag,
      description: "Review flagged content",
    },
    {
      id: "instructors",
      label: "Instructor Management",
      icon: Users,
      description: "Monitor instructor performance",
    },
    {
      id: "categories",
      label: "Category Management",
      icon: Tag,
      description: "Organize course categories",
    },
  ];

  // Fetch courses data
  const fetchCourses = async (reset = false) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
        setPagination((prev) => ({ ...prev, lastEvaluatedKey: null }));
      }

      const queryParams = new URLSearchParams({
        limit: pagination.limit.toString(),
        ...(pagination.lastEvaluatedKey &&
          !reset && { lastEvaluatedKey: pagination.lastEvaluatedKey }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(selectedInstructor && { instructorId: selectedInstructor }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const result = await response.json();

      if (reset) {
        setCourses(result.data.courses);
      } else {
        setCourses((prev) => [...prev, ...result.data.courses]);
      }

      setPagination((prev) => ({
        ...prev,
        lastEvaluatedKey: result.data.lastEvaluatedKey,
        hasMore: !!result.data.lastEvaluatedKey,
      }));
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError(error.message);
      // Set mock data for development
      if (reset) {
        setCourses([
          {
            courseId: "course-1",
            title: "Advanced React Development",
            description: "Learn advanced React concepts and patterns",
            instructorId: "instructor-1",
            instructorName: "John Smith",
            categoryId: "web-development",
            categoryName: "Web Development",
            status: "pending",
            price: 99.99,
            enrollmentCount: 0,
            rating: 0,
            reviewCount: 0,
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            thumbnailUrl: null,
            duration: "8 hours",
            level: "Advanced",
          },
          {
            courseId: "course-2",
            title: "Python for Data Science",
            description: "Complete guide to Python for data analysis",
            instructorId: "instructor-2",
            instructorName: "Jane Doe",
            categoryId: "data-science",
            categoryName: "Data Science",
            status: "approved",
            price: 149.99,
            enrollmentCount: 245,
            rating: 4.7,
            reviewCount: 89,
            createdAt: "2024-01-10T09:00:00Z",
            updatedAt: "2024-01-12T14:30:00Z",
            thumbnailUrl: null,
            duration: "12 hours",
            level: "Intermediate",
          },
          {
            courseId: "course-3",
            title: "Machine Learning Basics",
            description: "Introduction to machine learning concepts",
            instructorId: "instructor-3",
            instructorName: "Bob Wilson",
            categoryId: "data-science",
            categoryName: "Data Science",
            status: "rejected",
            price: 79.99,
            enrollmentCount: 0,
            rating: 0,
            reviewCount: 0,
            createdAt: "2024-01-08T16:00:00Z",
            updatedAt: "2024-01-09T11:15:00Z",
            thumbnailUrl: null,
            duration: "6 hours",
            level: "Beginner",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCourses(true);
  }, [token, selectedStatus, selectedCategory, selectedInstructor, searchTerm]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setSelectedStatus(status === selectedStatus ? "" : status);
  };

  // Handle category filter
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
  };

  // Handle course selection
  const handleCourseSelection = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Handle select all courses
  const handleSelectAll = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(courses.map((course) => course.courseId));
    }
  };

  // Handle view course details
  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
  };

  // Handle course approval workflow
  const handleApprovalWorkflow = (course) => {
    setSelectedCourse(course);
    setShowApprovalModal(true);
  };

  // Handle edit course
  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  // Handle course update
  const handleCourseUpdate = (updatedCourse) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.courseId === updatedCourse.courseId ? updatedCourse : course
      )
    );
  };

  // Handle bulk operations
  const handleBulkOperation = () => {
    if (selectedCourses.length === 0) return;
    setShowBulkModal(true);
  };

  // Handle bulk operation completion
  const handleBulkOperationComplete = () => {
    fetchCourses(true);
    setSelectedCourses([]);
    setShowBulkModal(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchCourses(true);
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
      draft: "bg-gray-100 text-gray-800",
      archived: "bg-purple-100 text-purple-800",
    };
    return colors[status] || colors.draft;
  };

  // Get level badge color
  const getLevelBadgeColor = (level) => {
    const colors = {
      Beginner: "bg-blue-100 text-blue-800",
      Intermediate: "bg-orange-100 text-orange-800",
      Advanced: "bg-red-100 text-red-800",
    };
    return colors[level] || colors.Beginner;
  };

  return (
    <div className="px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 mr-2" />
            Course Management
          </h1>
          <p className="text-gray-600">
            Manage courses, approvals, and content moderation
          </p>
        </div>
        {activeTab === "courses" && (
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "courses" && (
        <div>
          {/* Course Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Pending Approval
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.filter((c) => c.status === "pending").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Approved Courses
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.filter((c) => c.status === "approved").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Enrollments
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.reduce(
                        (sum, c) => sum + (c.enrollmentCount || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        courses.reduce(
                          (sum, c) =>
                            sum + (c.price || 0) * (c.enrollmentCount || 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Pending Approval
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.filter((c) => c.status === "pending").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Approved Courses
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.filter((c) => c.status === "approved").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Enrollments
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.reduce(
                        (sum, c) => sum + (c.enrollmentCount || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        courses.reduce(
                          (sum, c) =>
                            sum + (c.price || 0) * (c.enrollmentCount || 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search courses by title or description..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="flex space-x-2">
                    {["pending", "approved", "rejected", "draft"].map(
                      (status) => (
                        <Button
                          key={status}
                          variant={
                            selectedStatus === status ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleStatusFilter(status)}
                        >
                          {status}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Category:</span>
                  <div className="flex space-x-2">
                    {[
                      "web-development",
                      "data-science",
                      "mobile-development",
                    ].map((category) => (
                      <Button
                        key={category}
                        variant={
                          selectedCategory === category ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleCategoryFilter(category)}
                      >
                        {category.replace("-", " ")}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedCourses.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedCourses.length} course(s) selected
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkOperation}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Bulk Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkOperation}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Bulk Reject
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Courses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Courses ({courses.length})</span>
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-800">Error: {error}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={
                            courses.length > 0 &&
                            selectedCourses.length === courses.length
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.courseId}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.courseId)}
                            onChange={() =>
                              handleCourseSelection(course.courseId)
                            }
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              {course.thumbnailUrl ? (
                                <img
                                  src={course.thumbnailUrl}
                                  alt={course.title}
                                  className="h-12 w-16 rounded-lg object-cover"
                                />
                              ) : (
                                <BookOpen className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {course.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {course.duration} • {course.level}
                              </div>
                              <Badge
                                className={getLevelBadgeColor(course.level)}
                              >
                                {course.level}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {course.instructorName}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {course.categoryName}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(course.status)}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatCurrency(course.price)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {course.enrollmentCount}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            {course.rating > 0
                              ? course.rating.toFixed(1)
                              : "N/A"}
                            {course.reviewCount > 0 && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({course.reviewCount})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(course.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCourse(course)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {course.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprovalWorkflow(course)}
                                title="Review & Approve"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                              title="Edit Course"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="More Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Load More */}
              {pagination.hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchCourses(false)}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load More Courses"}
                  </Button>
                </div>
              )}

              {courses.length === 0 && !loading && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No courses found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Details Modal */}
          <CourseDetailsModal
            course={selectedCourse}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedCourse(null);
            }}
          />

          {/* Course Approval Modal */}
          <CourseApprovalModal
            course={selectedCourse}
            isOpen={showApprovalModal}
            onClose={() => {
              setShowApprovalModal(false);
              setSelectedCourse(null);
            }}
            onCourseUpdate={handleCourseUpdate}
          />

          {/* Course Edit Modal */}
          <CourseEditModal
            course={selectedCourse}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCourse(null);
            }}
            onCourseUpdate={handleCourseUpdate}
          />

          {/* Bulk Operations Modal */}
          <BulkCourseOperationsModal
            selectedCourses={selectedCourses}
            allCourses={courses}
            isOpen={showBulkModal}
            onClose={() => setShowBulkModal(false)}
            onOperationComplete={handleBulkOperationComplete}
          />
        </div>
      )}

      {/* Content Moderation Tab */}
      {activeTab === "moderation" && <ContentModerationPanel />}

      {/* Instructor Management Tab */}
      {activeTab === "instructors" && <InstructorManagementPanel />}

      {/* Category Management Tab */}
      {activeTab === "categories" && <CategoryManagementPanel />}
    </div>
  );
};

export default CourseManagementPage;

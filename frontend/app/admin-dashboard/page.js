"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Activity,
  Clock,
} from "lucide-react";

const AdminDashboardPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);

      if (!token) {
        console.error("No token available");
        setError("Authentication token not found. Please log in again.");
        return;
      }

      console.log(
        "Fetching dashboard data with token:",
        token ? "Token present" : "No token"
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard/overview`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Dashboard API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Dashboard API error:", errorData);
        throw new Error(
          errorData.message ||
            `Failed to fetch dashboard data (${response.status})`
        );
      }

      const result = await response.json();
      console.log("Dashboard data received:", result);
      setDashboardData(result.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
      // Don't set mock data - show the actual error
      /* Set mock data for development
      setDashboardData({
        metrics: {
          totalUsers: 1234,
          totalCourses: 89,
          totalEnrollments: 3420,
          totalRevenue: 45670.5,
          percentageChanges: {
            users: "12.5",
            courses: "5.2",
            enrollments: "18.3",
            revenue: "23.1",
          },
        },
        recentActivity: [
          {
            actionId: "1",
            adminId: "admin-1",
            action: "USER_ROLE_CHANGE",
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            details: {
              targetEntity: "USER#123",
              previousRole: "student",
              newRole: "instructor",
            },
          },
          {
            actionId: "2",
            adminId: "admin-1",
            action: "COURSE_APPROVAL",
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            details: {
              targetEntity: "COURSE#456",
              courseTitle: "Advanced React Development",
            },
          },
          {
            actionId: "3",
            adminId: "admin-2",
            action: "USER_STATUS_UPDATE",
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            details: {
              targetEntity: "USER#789",
              status: "suspended",
              reason: "Policy violation",
            },
          },
        ],
      }); */
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, token]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format percentage change
  const formatPercentageChange = (change) => {
    const num = parseFloat(change);
    const isPositive = num >= 0;
    return (
      <span
        className={`text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}
      >
        {isPositive ? "+" : ""}
        {change}% from last month
      </span>
    );
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get action display info
  const getActionDisplayInfo = (action) => {
    const actionMap = {
      USER_ROLE_CHANGE: {
        label: "Role Changed",
        color: "bg-blue-100 text-blue-800",
      },
      COURSE_APPROVAL: {
        label: "Course Approved",
        color: "bg-green-100 text-green-800",
      },
      USER_STATUS_UPDATE: {
        label: "User Status",
        color: "bg-yellow-100 text-yellow-800",
      },
      CONTENT_MODERATION: {
        label: "Content Moderated",
        color: "bg-red-100 text-red-800",
      },
    };
    return (
      actionMap[action] || { label: action, color: "bg-gray-100 text-gray-800" }
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="px-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="px-6">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-gray-600 mb-4 text-center max-w-md">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600">
            Welcome to the UpSkillPro Admin Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">
            Error loading dashboard data: {error}
          </span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.metrics?.totalUsers?.toLocaleString() || "0"}
            </div>
            {dashboardData?.metrics?.percentageChanges?.users &&
              formatPercentageChange(
                dashboardData.metrics.percentageChanges.users
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.metrics?.totalCourses?.toLocaleString() || "0"}
            </div>
            {dashboardData?.metrics?.percentageChanges?.courses &&
              formatPercentageChange(
                dashboardData.metrics.percentageChanges.courses
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.metrics?.totalEnrollments?.toLocaleString() ||
                "0"}
            </div>
            {dashboardData?.metrics?.percentageChanges?.enrollments &&
              formatPercentageChange(
                dashboardData.metrics.percentageChanges.enrollments
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.metrics?.totalRevenue
                ? formatCurrency(dashboardData.metrics.totalRevenue)
                : "$0"}
            </div>
            {dashboardData?.metrics?.percentageChanges?.revenue &&
              formatPercentageChange(
                dashboardData.metrics.percentageChanges.revenue
              )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Admin Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentActivity?.length > 0 ? (
                dashboardData.recentActivity.map((activity) => {
                  const actionInfo = getActionDisplayInfo(activity.action);
                  return (
                    <div
                      key={activity.actionId}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={actionInfo.color}>
                            {actionInfo.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {activity.details?.courseTitle &&
                            `Course: ${activity.details.courseTitle}`}
                          {activity.details?.previousRole &&
                            activity.details?.newRole &&
                            `Role changed from ${activity.details.previousRole} to ${activity.details.newRole}`}
                          {activity.details?.status &&
                            activity.details?.reason &&
                            `Status: ${activity.details.status} - ${activity.details.reason}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Admin: {activity.adminId}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">
                    Pending Course Approvals
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  5 courses are waiting for approval
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    System Maintenance
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Scheduled maintenance in 2 days
                </p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    System Status
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  All systems operational
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

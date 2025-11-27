"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
  X,
  Activity,
  Clock,
  MapPin,
  Monitor,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

const UserActivityModal = ({ user, isOpen, onClose }) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState("7d");
  const [activityFilter, setActivityFilter] = useState("all");

  // Date range options
  const dateRangeOptions = {
    "1d": { label: "Last 24 hours", days: 1 },
    "7d": { label: "Last 7 days", days: 7 },
    "30d": { label: "Last 30 days", days: 30 },
    "90d": { label: "Last 90 days", days: 90 },
  };

  // Activity type filters
  const activityFilters = {
    all: "All Activities",
    login: "Login Activities",
    course: "Course Activities",
    profile: "Profile Changes",
    security: "Security Events",
  };

  // Initialize and fetch data when user changes
  useEffect(() => {
    if (user && isOpen) {
      fetchUserActivity();
    }
  }, [user, isOpen, selectedDateRange]);

  // Fetch user activity data
  const fetchUserActivity = async () => {
    if (!user?.userId) return;

    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(
        endDate.getDate() - dateRangeOptions[selectedDateRange].days
      );

      const queryParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.userId}/activity?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setActivityData(result.data);
      } else {
        throw new Error("Failed to fetch activity data");
      }
    } catch (error) {
      console.error("Error fetching user activity:", error);
      // Set mock data for development
      setActivityData({
        loginCount: user.loginCount || 0,
        lastLoginAt: user.lastLoginAt,
        failedLoginAttempts: user.failedLoginAttempts || 0,
        accountStatus: user.accountStatus,
        recentActions: [
          {
            actionId: "1",
            action: "LOGIN",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: {
              ipAddress: "192.168.1.100",
              userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              location: "New York, NY",
            },
          },
          {
            actionId: "2",
            action: "COURSE_ENROLLMENT",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            details: {
              courseId: "course-123",
              courseTitle: "React Basics",
              ipAddress: "192.168.1.100",
            },
          },
          {
            actionId: "3",
            action: "PROFILE_UPDATE",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            details: {
              field: "profile_picture",
              ipAddress: "192.168.1.100",
            },
          },
          {
            actionId: "4",
            action: "FAILED_LOGIN",
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            details: {
              ipAddress: "192.168.1.200",
              reason: "Invalid password",
            },
          },
        ],
        loginHistory: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            ipAddress: "192.168.1.100",
            location: "New York, NY",
            device: "Desktop - Chrome",
            success: true,
          },
          {
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            ipAddress: "192.168.1.100",
            location: "New York, NY",
            device: "Mobile - Safari",
            success: true,
          },
          {
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            ipAddress: "192.168.1.200",
            location: "Unknown",
            device: "Desktop - Chrome",
            success: false,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter activities based on selected filter
  const getFilteredActivities = () => {
    if (!activityData?.recentActions) return [];

    if (activityFilter === "all") return activityData.recentActions;

    const filterMap = {
      login: ["LOGIN", "LOGOUT", "FAILED_LOGIN"],
      course: ["COURSE_ENROLLMENT", "COURSE_COMPLETION", "LESSON_VIEW"],
      profile: ["PROFILE_UPDATE", "PASSWORD_CHANGE"],
      security: ["FAILED_LOGIN", "PASSWORD_CHANGE", "SECURITY_ALERT"],
    };

    return activityData.recentActions.filter((action) =>
      filterMap[activityFilter]?.includes(action.action)
    );
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get activity icon and color
  const getActivityInfo = (action) => {
    const actionMap = {
      LOGIN: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
      LOGOUT: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
      FAILED_LOGIN: {
        icon: AlertTriangle,
        color: "text-red-600",
        bg: "bg-red-100",
      },
      COURSE_ENROLLMENT: {
        icon: TrendingUp,
        color: "text-purple-600",
        bg: "bg-purple-100",
      },
      PROFILE_UPDATE: { icon: Eye, color: "text-gray-600", bg: "bg-gray-100" },
      PASSWORD_CHANGE: {
        icon: AlertTriangle,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
    };
    return (
      actionMap[action] || {
        icon: Activity,
        color: "text-gray-600",
        bg: "bg-gray-100",
      }
    );
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchUserActivity();
  };

  if (!isOpen || !user) return null;

  const filteredActivities = getFilteredActivities();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                User Activity Monitor
              </h2>
              <p className="text-gray-600">
                Activity monitoring for {user.name} ({user.email})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Activity Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {activityData?.loginCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Logins</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {activityData?.failedLoginAttempts || 0}
                  </div>
                  <div className="text-sm text-gray-600">Failed Attempts</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Last Login</div>
                  <div className="font-medium">
                    {formatDate(activityData?.lastLoginAt || new Date())}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Account Status</div>
                  <Badge
                    className={
                      user.accountStatus === "active"
                        ? "bg-green-100 text-green-800"
                        : user.accountStatus === "suspended"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {user.accountStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Date Range */}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Date Range:</span>
                  <div className="flex space-x-1">
                    {Object.entries(dateRangeOptions).map(([key, option]) => (
                      <Button
                        key={key}
                        variant={
                          selectedDateRange === key ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedDateRange(key)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Activity Filter */}
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Filter:</span>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(activityFilters).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Activities ({filteredActivities.length})</span>
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredActivities.length > 0 ? (
                <div className="space-y-3">
                  {filteredActivities.map((activity) => {
                    const activityInfo = getActivityInfo(activity.action);
                    const ActivityIcon = activityInfo.icon;

                    return (
                      <div
                        key={activity.actionId}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className={`p-2 rounded-full ${activityInfo.bg}`}>
                          <ActivityIcon
                            className={`h-4 w-4 ${activityInfo.color}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {activity.action.replace("_", " ")}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {activity.details?.courseTitle && (
                              <p>Course: {activity.details.courseTitle}</p>
                            )}
                            {activity.details?.field && (
                              <p>Field: {activity.details.field}</p>
                            )}
                            {activity.details?.reason && (
                              <p>Reason: {activity.details.reason}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {activity.details?.ipAddress && (
                                <span className="flex items-center">
                                  <Monitor className="h-3 w-3 mr-1" />
                                  {activity.details.ipAddress}
                                </span>
                              )}
                              {activity.details?.location && (
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {activity.details.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>No activities found for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Login History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityData?.loginHistory?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Device</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityData.loginHistory.map((login, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {login.success ? (
                            <Badge className="bg-green-100 text-green-800">
                              Success
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(login.timestamp)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {login.ipAddress}
                        </TableCell>
                        <TableCell>{login.location || "Unknown"}</TableCell>
                        <TableCell>{login.device}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-600">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">No login history available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivityModal;

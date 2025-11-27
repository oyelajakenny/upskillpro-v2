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
  User,
  Mail,
  Calendar,
  Shield,
  Activity,
  Clock,
  MapPin,
  Phone,
  Edit,
  Save,
  AlertTriangle,
} from "lucide-react";

const UserProfileModal = ({ user, isOpen, onClose, onUserUpdate }) => {
  const { token } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userActivity, setUserActivity] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    accountStatus: "",
    phone: "",
    location: "",
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        accountStatus: user.accountStatus || "",
        phone: user.phone || "",
        location: user.location || "",
      });
      fetchUserActivity();
    }
  }, [user]);

  // Fetch user activity data
  const fetchUserActivity = async () => {
    if (!user?.userId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.userId}/activity`,
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
        setUserActivity(result.data);
      }
    } catch (error) {
      console.error("Error fetching user activity:", error);
      // Set mock data for development
      setUserActivity({
        loginCount: user.loginCount || 0,
        lastLoginAt: user.lastLoginAt,
        failedLoginAttempts: user.failedLoginAttempts || 0,
        accountStatus: user.accountStatus,
        recentActions: [
          {
            actionId: "1",
            action: "LOGIN",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: { ipAddress: "192.168.1.100" },
          },
          {
            actionId: "2",
            action: "COURSE_ENROLLMENT",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            details: { courseId: "course-123", courseTitle: "React Basics" },
          },
        ],
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save user changes
  const handleSaveUser = async () => {
    setLoading(true);
    try {
      // Update user profile
      const profileResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            location: editForm.location,
          }),
        }
      );

      // Update user role if changed
      if (editForm.role !== user.role) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.userId}/role`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role: editForm.role,
              reason: "Admin role update",
            }),
          }
        );
      }

      // Update account status if changed
      if (editForm.accountStatus !== user.accountStatus) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.userId}/status`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: editForm.accountStatus,
              reason: "Admin status update",
            }),
          }
        );
      }

      // Update parent component
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          ...editForm,
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      instructor: "bg-green-100 text-green-800",
      student: "bg-gray-100 text-gray-800",
    };
    return colors[role] || colors.student;
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || colors.pending;
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <User className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="text-xl font-bold border-b border-gray-300 focus:border-blue-500 outline-none"
                  />
                ) : (
                  user.name
                )}
              </h2>
              <p className="text-gray-600">User ID: {user.userId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveUser} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save"}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone number"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{user.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        handleInputChange("role", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.accountStatus}
                      onChange={(e) =>
                        handleInputChange("accountStatus", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-gray-400" />
                      <Badge
                        className={getStatusBadgeColor(user.accountStatus)}
                      >
                        {user.accountStatus}
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Location"
                    />
                  ) : (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{user.location || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joined Date
                  </label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userActivity?.loginCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Logins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userActivity?.failedLoginAttempts || 0}
                  </div>
                  <div className="text-sm text-gray-600">Failed Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Last Login</div>
                  <div className="font-medium">
                    {formatDate(userActivity?.lastLoginAt)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Status</div>
                  <Badge className={getStatusBadgeColor(user.accountStatus)}>
                    {user.accountStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userActivity?.recentActions?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivity.recentActions.map((action) => (
                      <TableRow key={action.actionId}>
                        <TableCell>
                          <Badge variant="outline">{action.action}</Badge>
                        </TableCell>
                        <TableCell>
                          {action.details?.courseTitle && (
                            <span>Course: {action.details.courseTitle}</span>
                          )}
                          {action.details?.ipAddress && (
                            <span>IP: {action.details.ipAddress}</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(action.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-600">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

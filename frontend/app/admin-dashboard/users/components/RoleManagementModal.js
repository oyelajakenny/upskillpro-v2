"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  Shield,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";

const RoleManagementModal = ({ user, isOpen, onClose, onRoleUpdate }) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [reason, setReason] = useState("");
  const [roleHistory, setRoleHistory] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Role definitions with descriptions and permissions
  const roleDefinitions = {
    student: {
      name: "Student",
      description: "Can enroll in courses and access learning materials",
      permissions: ["view_courses", "enroll_courses", "access_content"],
      color: "bg-gray-100 text-gray-800",
    },
    instructor: {
      name: "Instructor",
      description: "Can create and manage courses, view student progress",
      permissions: [
        "create_courses",
        "manage_courses",
        "view_analytics",
        "grade_students",
      ],
      color: "bg-green-100 text-green-800",
    },
    admin: {
      name: "Admin",
      description: "Can manage users and courses, access basic admin features",
      permissions: [
        "manage_users",
        "manage_courses",
        "view_reports",
        "moderate_content",
      ],
      color: "bg-blue-100 text-blue-800",
    },
    super_admin: {
      name: "Super Admin",
      description: "Full system access with all administrative privileges",
      permissions: [
        "full_access",
        "manage_admins",
        "system_settings",
        "audit_logs",
      ],
      color: "bg-purple-100 text-purple-800",
    },
  };

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || "");
      setReason("");
      fetchRoleHistory();
    }
  }, [user]);

  // Fetch role change history
  const fetchRoleHistory = async () => {
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
        // Filter for role change actions
        const roleChanges =
          result.data.recentActions?.filter(
            (action) => action.action === "USER_ROLE_CHANGE"
          ) || [];
        setRoleHistory(roleChanges);
      }
    } catch (error) {
      console.error("Error fetching role history:", error);
      // Set mock data for development
      setRoleHistory([
        {
          actionId: "1",
          action: "USER_ROLE_CHANGE",
          timestamp: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          adminId: "admin-1",
          details: {
            previousRole: "student",
            newRole: "instructor",
            reason: "Instructor application approved",
          },
        },
      ]);
    }
  };

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === user.role) {
      setShowConfirmation(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.userId}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: selectedRole,
            reason: reason || "Role updated by admin",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        // Update parent component
        if (onRoleUpdate) {
          onRoleUpdate({
            ...user,
            role: selectedRole,
          });
        }

        // Refresh role history
        await fetchRoleHistory();

        setShowConfirmation(false);
        setReason("");
      } else {
        const errorData = await response.json();
        console.error("Role change failed:", errorData.message);
      }
    } catch (error) {
      console.error("Error changing role:", error);
    } finally {
      setLoading(false);
    }
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

  // Handle close
  const handleClose = () => {
    setSelectedRole(user?.role || "");
    setReason("");
    setShowConfirmation(false);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Role Management
              </h2>
              <p className="text-gray-600">
                Manage role for {user.name} ({user.email})
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Badge className={roleDefinitions[user.role]?.color}>
                  {roleDefinitions[user.role]?.name || user.role}
                </Badge>
                <span className="text-gray-600">
                  {roleDefinitions[user.role]?.description}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Change Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(roleDefinitions).map(([roleKey, roleDef]) => (
                  <div
                    key={roleKey}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRole === roleKey
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedRole(roleKey)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="role"
                          value={roleKey}
                          checked={selectedRole === roleKey}
                          onChange={() => setSelectedRole(roleKey)}
                          className="text-blue-600"
                        />
                        <Badge className={roleDef.color}>{roleDef.name}</Badge>
                      </div>
                      {user.role === roleKey && (
                        <span className="text-xs text-green-600 font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {roleDef.description}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700">
                        Permissions:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {roleDef.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                          >
                            {permission.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Role Change
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for role change..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Warning for role changes */}
              {selectedRole && selectedRole !== user.role && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">
                      Role Change Warning
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changing the user's role will immediately affect their
                    permissions and access to platform features. This action
                    will be logged for audit purposes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2" />
                Role Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roleHistory.length > 0 ? (
                <div className="space-y-3">
                  {roleHistory.map((change) => (
                    <div
                      key={change.actionId}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">
                            Role changed from{" "}
                            <Badge
                              className={
                                roleDefinitions[change.details?.previousRole]
                                  ?.color
                              }
                            >
                              {change.details?.previousRole}
                            </Badge>{" "}
                            to{" "}
                            <Badge
                              className={
                                roleDefinitions[change.details?.newRole]?.color
                              }
                            >
                              {change.details?.newRole}
                            </Badge>
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {change.details?.reason}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>By: {change.adminId}</span>
                          <span>{formatDate(change.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600">
                  <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">No role changes recorded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Dialog */}
          {showConfirmation && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  <div>
                    <h3 className="font-medium text-orange-900">
                      Confirm Role Change
                    </h3>
                    <p className="text-sm text-orange-700">
                      Are you sure you want to change {user.name}'s role from{" "}
                      <strong>{user.role}</strong> to{" "}
                      <strong>{selectedRole}</strong>?
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmation(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRoleChange}
                    disabled={loading}
                  >
                    {loading ? "Changing..." : "Confirm Change"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            {selectedRole !== user.role && (
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={loading || !selectedRole}
              >
                Change Role
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementModal;

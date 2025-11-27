"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  UserX,
  User,
  Shield,
} from "lucide-react";

const AccountStatusModal = ({ user, isOpen, onClose, onStatusUpdate }) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [reason, setReason] = useState("");
  const [statusHistory, setStatusHistory] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Status definitions
  const statusDefinitions = {
    active: {
      name: "Active",
      description: "User has full access to the platform",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800",
      actionColor: "text-green-600",
    },
    suspended: {
      name: "Suspended",
      description: "User access is temporarily restricted",
      icon: UserX,
      color: "bg-red-100 text-red-800",
      actionColor: "text-red-600",
    },
    pending: {
      name: "Pending",
      description: "User account is awaiting verification or approval",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800",
      actionColor: "text-yellow-600",
    },
  };

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setSelectedStatus(user.accountStatus || "");
      setReason("");
      fetchStatusHistory();
    }
  }, [user]);

  // Fetch status change history
  const fetchStatusHistory = async () => {
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
        // Filter for status change actions
        const statusChanges =
          result.data.recentActions?.filter(
            (action) => action.action === "USER_STATUS_UPDATE"
          ) || [];
        setStatusHistory(statusChanges);
      }
    } catch (error) {
      console.error("Error fetching status history:", error);
      // Set mock data for development
      setStatusHistory([
        {
          actionId: "1",
          action: "USER_STATUS_UPDATE",
          timestamp: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          adminId: "admin-1",
          details: {
            previousStatus: "pending",
            newStatus: "active",
            reason: "Account verification completed",
          },
        },
      ]);
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === user.accountStatus) {
      setShowConfirmation(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.userId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
            reason: reason || "Status updated by admin",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        // Update parent component
        if (onStatusUpdate) {
          onStatusUpdate({
            ...user,
            accountStatus: selectedStatus,
          });
        }

        // Refresh status history
        await fetchStatusHistory();

        setShowConfirmation(false);
        setReason("");
      } else {
        const errorData = await response.json();
        console.error("Status change failed:", errorData.message);
      }
    } catch (error) {
      console.error("Error changing status:", error);
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
    setSelectedStatus(user?.accountStatus || "");
    setReason("");
    setShowConfirmation(false);
    onClose();
  };

  // Get impact message for status change
  const getStatusChangeImpact = (newStatus) => {
    const impacts = {
      active: "User will regain full access to all platform features.",
      suspended:
        "User will lose access to the platform immediately. They will not be able to log in or access any content.",
      pending:
        "User access will be limited until further review or verification.",
    };
    return impacts[newStatus] || "";
  };

  if (!isOpen || !user) return null;

  const currentStatusDef = statusDefinitions[user.accountStatus];
  const CurrentStatusIcon = currentStatusDef?.icon || User;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Account Status Management
              </h2>
              <p className="text-gray-600">
                Manage account status for {user.name} ({user.email})
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <CurrentStatusIcon
                  className={`h-5 w-5 ${currentStatusDef?.actionColor}`}
                />
                <Badge className={currentStatusDef?.color}>
                  {currentStatusDef?.name || user.accountStatus}
                </Badge>
                <span className="text-gray-600">
                  {currentStatusDef?.description}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Change Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(statusDefinitions).map(
                  ([statusKey, statusDef]) => {
                    const StatusIcon = statusDef.icon;
                    return (
                      <div
                        key={statusKey}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedStatus === statusKey
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedStatus(statusKey)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="status"
                              value={statusKey}
                              checked={selectedStatus === statusKey}
                              onChange={() => setSelectedStatus(statusKey)}
                              className="text-blue-600"
                            />
                            <StatusIcon
                              className={`h-5 w-5 ${statusDef.actionColor}`}
                            />
                            <Badge className={statusDef.color}>
                              {statusDef.name}
                            </Badge>
                          </div>
                          {user.accountStatus === statusKey && (
                            <span className="text-xs text-green-600 font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 ml-8">
                          {statusDef.description}
                        </p>
                        {selectedStatus === statusKey &&
                          statusKey !== user.accountStatus && (
                            <div className="mt-3 ml-8 p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-sm text-blue-800">
                                <strong>Impact:</strong>{" "}
                                {getStatusChangeImpact(statusKey)}
                              </p>
                            </div>
                          )}
                      </div>
                    );
                  }
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Status Change
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for status change..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Warning for status changes */}
              {selectedStatus && selectedStatus !== user.accountStatus && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">
                      Status Change Warning
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changing the user's account status will immediately affect
                    their ability to access the platform. This action will be
                    logged for audit purposes and may trigger automated
                    notifications.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2" />
                Status Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {statusHistory.map((change) => {
                    const prevStatusDef =
                      statusDefinitions[change.details?.previousStatus];
                    const newStatusDef =
                      statusDefinitions[change.details?.newStatus];
                    const PrevIcon = prevStatusDef?.icon || User;
                    const NewIcon = newStatusDef?.icon || User;

                    return (
                      <div
                        key={change.actionId}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">
                              Status changed from{" "}
                              <Badge className={prevStatusDef?.color}>
                                {change.details?.previousStatus}
                              </Badge>{" "}
                              to{" "}
                              <Badge className={newStatusDef?.color}>
                                {change.details?.newStatus}
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">No status changes recorded</p>
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
                      Confirm Status Change
                    </h3>
                    <p className="text-sm text-orange-700">
                      Are you sure you want to change {user.name}'s status from{" "}
                      <strong>{user.accountStatus}</strong> to{" "}
                      <strong>{selectedStatus}</strong>?
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      {getStatusChangeImpact(selectedStatus)}
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
                    onClick={handleStatusChange}
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
            {selectedStatus !== user.accountStatus && (
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={loading || !selectedStatus}
              >
                Change Status
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatusModal;

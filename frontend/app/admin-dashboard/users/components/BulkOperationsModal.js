"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  Users,
  UserCheck,
  UserX,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const BulkOperationsModal = ({
  selectedUsers,
  allUsers,
  isOpen,
  onClose,
  onOperationComplete,
}) => {
  const { token } = useSelector((state) => state.auth);
  const [operation, setOperation] = useState("");
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [results, setResults] = useState(null);

  // Get selected user details
  const selectedUserDetails = allUsers.filter((user) =>
    selectedUsers.includes(user.userId)
  );

  // Handle bulk operation execution
  const handleExecuteOperation = async () => {
    if (!operation) return;

    setLoading(true);
    setResults(null);

    try {
      const operationResults = [];

      for (const userId of selectedUsers) {
        try {
          let response;

          switch (operation) {
            case "activate":
              response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/status`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    status: "active",
                    reason: reason || "Bulk activation",
                  }),
                }
              );
              break;

            case "suspend":
              response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/status`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    status: "suspended",
                    reason: reason || "Bulk suspension",
                  }),
                }
              );
              break;

            case "changeRole":
              response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/role`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    role: newRole,
                    reason: reason || "Bulk role change",
                  }),
                }
              );
              break;

            default:
              throw new Error("Invalid operation");
          }

          if (response.ok) {
            operationResults.push({
              userId,
              success: true,
              message: "Operation completed successfully",
            });
          } else {
            const errorData = await response.json();
            operationResults.push({
              userId,
              success: false,
              message: errorData.message || "Operation failed",
            });
          }
        } catch (error) {
          operationResults.push({
            userId,
            success: false,
            message: error.message,
          });
        }
      }

      setResults(operationResults);

      // Notify parent component of completion
      if (onOperationComplete) {
        onOperationComplete(operationResults);
      }
    } catch (error) {
      console.error("Bulk operation error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setOperation("");
    setNewRole("");
    setNewStatus("");
    setReason("");
    setResults(null);
  };

  // Handle close
  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Bulk Operations</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selected Users Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {selectedUsers.length} user(s) selected for bulk operation
                </p>
                <div className="max-h-32 overflow-y-auto">
                  {selectedUserDetails.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between py-1 text-sm"
                    >
                      <span>{user.name}</span>
                      <span className="text-gray-500">{user.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operation Selection */}
          {!results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Select Operation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Operation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="operation"
                        value="activate"
                        checked={operation === "activate"}
                        onChange={(e) => setOperation(e.target.value)}
                        className="mr-2"
                      />
                      <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                      Activate Users
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="operation"
                        value="suspend"
                        checked={operation === "suspend"}
                        onChange={(e) => setOperation(e.target.value)}
                        className="mr-2"
                      />
                      <UserX className="h-4 w-4 mr-2 text-red-600" />
                      Suspend Users
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="operation"
                        value="changeRole"
                        checked={operation === "changeRole"}
                        onChange={(e) => setOperation(e.target.value)}
                        className="mr-2"
                      />
                      <Shield className="h-4 w-4 mr-2 text-blue-600" />
                      Change Role
                    </label>
                  </div>
                </div>

                {/* Role Selection (if changing roles) */}
                {operation === "changeRole" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a role</option>
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for this bulk operation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                {/* Warning */}
                {operation && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">
                        Warning
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This operation will affect {selectedUsers.length} user(s).
                      This action cannot be undone automatically.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.map((result) => {
                    const user = selectedUserDetails.find(
                      (u) => u.userId === result.userId
                    );
                    return (
                      <div
                        key={result.userId}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          result.success
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div className="flex items-center">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                          )}
                          <span className="text-sm font-medium">
                            {user?.name || result.userId}
                          </span>
                        </div>
                        <span
                          className={`text-xs ${
                            result.success ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {result.message}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Summary:</span>{" "}
                    {results.filter((r) => r.success).length} successful,{" "}
                    {results.filter((r) => !r.success).length} failed
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              {results ? "Close" : "Cancel"}
            </Button>
            {!results && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  onClick={handleExecuteOperation}
                  disabled={
                    !operation ||
                    loading ||
                    (operation === "changeRole" && !newRole)
                  }
                >
                  {loading ? "Processing..." : "Execute Operation"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperationsModal;

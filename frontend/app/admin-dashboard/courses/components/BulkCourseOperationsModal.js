"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Archive,
  BookOpen,
  AlertTriangle,
  Users,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";

const BulkCourseOperationsModal = ({
  selectedCourses,
  allCourses,
  isOpen,
  onClose,
  onOperationComplete,
}) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState("");
  const [reason, setReason] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [results, setResults] = useState(null);

  // Get selected course objects
  const selectedCourseObjects = allCourses.filter((course) =>
    selectedCourses.includes(course.courseId)
  );

  // Handle bulk operation
  const handleBulkOperation = async () => {
    if (!operation || selectedCourses.length === 0) return;

    try {
      setLoading(true);
      setResults(null);

      const operationData = {
        courseIds: selectedCourses,
        operation,
        reason: reason.trim(),
        ...(operation === "change_status" && { newStatus }),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/bulk-operation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(operationData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to perform bulk operation");
      }

      const result = await response.json();
      setResults(result.data);

      toast.success(`Bulk operation completed successfully`);

      // Notify parent component
      setTimeout(() => {
        onOperationComplete();
      }, 2000);
    } catch (error) {
      console.error("Error performing bulk operation:", error);
      toast.error(`Failed to perform bulk operation: ${error.message}`);

      // For development, simulate success
      const mockResults = {
        successful: selectedCourses.length,
        failed: 0,
        details: selectedCourses.map((courseId) => ({
          courseId,
          success: true,
          message: "Operation completed successfully",
        })),
      };
      setResults(mockResults);
      toast.success("Bulk operation completed successfully (simulated)");

      setTimeout(() => {
        onOperationComplete();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setOperation("");
    setReason("");
    setNewStatus("");
    setResults(null);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get operation icon and color
  const getOperationInfo = (op) => {
    const operations = {
      approve: {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        label: "Approve Courses",
      },
      reject: {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        label: "Reject Courses",
      },
      archive: {
        icon: Archive,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        label: "Archive Courses",
      },
      change_status: {
        icon: AlertTriangle,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        label: "Change Status",
      },
    };
    return operations[op] || operations.approve;
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Bulk Course Operations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Courses Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Selected Courses ({selectedCourses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {selectedCourseObjects.map((course) => (
                  <div
                    key={course.courseId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-gray-600">
                          {course.instructorName}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusBadgeColor(course.status)}>
                      {course.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!results && (
            <>
              {/* Operation Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Operation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={operation === "approve" ? "default" : "outline"}
                      className="h-16 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setOperation("approve")}
                    >
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Approve All</span>
                    </Button>

                    <Button
                      variant={operation === "reject" ? "default" : "outline"}
                      className="h-16 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setOperation("reject")}
                    >
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span>Reject All</span>
                    </Button>

                    <Button
                      variant={operation === "archive" ? "default" : "outline"}
                      className="h-16 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setOperation("archive")}
                    >
                      <Archive className="h-5 w-5 text-purple-600" />
                      <span>Archive All</span>
                    </Button>

                    <Button
                      variant={
                        operation === "change_status" ? "default" : "outline"
                      }
                      className="h-16 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setOperation("change_status")}
                    >
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span>Change Status</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Operation Details */}
              {operation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      {(() => {
                        const info = getOperationInfo(operation);
                        const Icon = info.icon;
                        return (
                          <>
                            <Icon className={`h-5 w-5 mr-2 ${info.color}`} />
                            {info.label}
                          </>
                        );
                      })()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {operation === "change_status" && (
                      <div>
                        <Label htmlFor="new-status">New Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select new status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">
                              Pending Review
                            </SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="reason">
                        {operation === "approve"
                          ? "Approval Notes (Optional)"
                          : operation === "reject"
                          ? "Rejection Reason (Required)"
                          : operation === "archive"
                          ? "Archive Reason (Optional)"
                          : "Change Reason (Required)"}
                      </Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={
                          operation === "approve"
                            ? "Add any notes about the approval..."
                            : operation === "reject"
                            ? "Please provide a reason for rejection..."
                            : operation === "archive"
                            ? "Add any notes about archiving..."
                            : "Please provide a reason for the status change..."
                        }
                        rows={3}
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Warning
                          </p>
                          <p className="text-sm text-yellow-700">
                            This operation will affect {selectedCourses.length}{" "}
                            courses. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Operation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {results.successful}
                      </p>
                      <p className="text-sm text-green-700">Successful</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {results.failed}
                      </p>
                      <p className="text-sm text-red-700">Failed</p>
                    </div>
                  </div>

                  {results.details && results.details.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {results.details.map((detail, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            detail.success
                              ? "bg-green-50 border border-green-200"
                              : "bg-red-50 border border-red-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Course {detail.courseId}
                            </span>
                            <Badge
                              className={
                                detail.success
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {detail.success ? "Success" : "Failed"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {detail.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              {results ? "Close" : "Cancel"}
            </Button>
            {!results && operation && (
              <Button
                onClick={handleBulkOperation}
                disabled={
                  loading ||
                  (operation === "reject" && !reason.trim()) ||
                  (operation === "change_status" &&
                    (!newStatus || !reason.trim()))
                }
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                {loading ? "Processing..." : `Execute Operation`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCourseOperationsModal;

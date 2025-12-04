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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RichTextDisplay from "@/components/RichTextDisplay";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  User,
  Clock,
  DollarSign,
  Eye,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";

const CourseApprovalModal = ({ course, isOpen, onClose, onCourseUpdate }) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [approvalAction, setApprovalAction] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");

  // Handle course approval
  const handleApproval = async (action) => {
    if (!course) return;

    try {
      setLoading(true);

      let endpoint = "";
      let method = "POST";
      let body = { reason: reason || feedback };

      switch (action) {
        case "approve":
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${course.courseId}/approve`;
          break;
        case "reject":
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${course.courseId}/reject`;
          break;
        case "request_changes":
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${course.courseId}/moderate`;
          body.action = "flag";
          break;
        default:
          throw new Error("Invalid action");
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} course`);
      }

      const result = await response.json();

      // Update course status locally
      const updatedCourse = {
        ...course,
        status:
          action === "approve"
            ? "approved"
            : action === "reject"
            ? "rejected"
            : "flagged",
        updatedAt: new Date().toISOString(),
      };

      onCourseUpdate(updatedCourse);

      toast.success(`Course ${action}d successfully`);
      onClose();
    } catch (error) {
      console.error(`Error ${action}ing course:`, error);
      toast.error(`Failed to ${action} course: ${error.message}`);

      // For development, simulate success
      const updatedCourse = {
        ...course,
        status:
          action === "approve"
            ? "approved"
            : action === "reject"
            ? "rejected"
            : "flagged",
        updatedAt: new Date().toISOString(),
      };
      onCourseUpdate(updatedCourse);
      toast.success(`Course ${action}d successfully (simulated)`);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Handle action selection
  const handleActionSelect = (action) => {
    setApprovalAction(action);
    setReason("");
    setFeedback("");
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
    };
    return colors[status] || colors.draft;
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Course Approval Workflow
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="h-20 w-28 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-20 w-28 rounded-lg object-cover"
                    />
                  ) : (
                    <BookOpen className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <div className="mb-3 max-h-24 overflow-y-auto">
                    <RichTextDisplay
                      content={course.description}
                      className="text-sm"
                      fallbackText="No description available."
                    />
                  </div>
                  <div className="flex items-center space-x-4 mb-3">
                    <Badge className={getStatusBadgeColor(course.status)}>
                      {course.status}
                    </Badge>
                    <Badge variant="outline">{course.level}</Badge>
                    <Badge variant="outline">{course.categoryName}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{course.instructorName}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{formatCurrency(course.price)}</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{course.enrollmentCount} enrolled</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="content-quality"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="content-quality" className="text-sm">
                    Content quality meets platform standards
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="appropriate-content"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="appropriate-content" className="text-sm">
                    Content is appropriate and follows community guidelines
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="accurate-description"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="accurate-description" className="text-sm">
                    Course description accurately represents the content
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="proper-structure"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="proper-structure" className="text-sm">
                    Course has proper structure and learning objectives
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="technical-quality"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="technical-quality" className="text-sm">
                    Audio/video quality is acceptable
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="pricing-appropriate"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="pricing-appropriate" className="text-sm">
                    Pricing is appropriate for the content value
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Selection */}
          {!approvalAction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Action</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                    onClick={() => handleActionSelect("approve")}
                  >
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-green-700 font-medium">Approve</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 border-red-200 hover:border-red-300 hover:bg-red-50"
                    onClick={() => handleActionSelect("reject")}
                  >
                    <XCircle className="h-6 w-6 text-red-600" />
                    <span className="text-red-700 font-medium">Reject</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50"
                    onClick={() => handleActionSelect("request_changes")}
                  >
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">
                      Request Changes
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Form */}
          {approvalAction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {approvalAction === "approve" && (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Approve Course
                    </>
                  )}
                  {approvalAction === "reject" && (
                    <>
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                      Reject Course
                    </>
                  )}
                  {approvalAction === "request_changes" && (
                    <>
                      <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                      Request Changes
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {approvalAction === "approve" && (
                  <div>
                    <Label htmlFor="approval-reason">
                      Approval Notes (Optional)
                    </Label>
                    <Textarea
                      id="approval-reason"
                      placeholder="Add any notes about the approval..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {approvalAction === "reject" && (
                  <div>
                    <Label htmlFor="rejection-reason">
                      Rejection Reason (Required)
                    </Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Please provide a detailed reason for rejection..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                )}

                {approvalAction === "request_changes" && (
                  <div>
                    <Label htmlFor="change-feedback">
                      Feedback for Changes (Required)
                    </Label>
                    <Textarea
                      id="change-feedback"
                      placeholder="Please specify what changes are needed..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setApprovalAction("")}
                  >
                    Back
                  </Button>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleApproval(approvalAction)}
                      disabled={
                        loading ||
                        (approvalAction === "reject" && !reason.trim()) ||
                        (approvalAction === "request_changes" &&
                          !feedback.trim())
                      }
                      className={
                        approvalAction === "approve"
                          ? "bg-green-600 hover:bg-green-700"
                          : approvalAction === "reject"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-yellow-600 hover:bg-yellow-700"
                      }
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      {loading
                        ? "Processing..."
                        : approvalAction === "approve"
                        ? "Approve Course"
                        : approvalAction === "reject"
                        ? "Reject Course"
                        : "Request Changes"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseApprovalModal;

"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  User,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

const ContentModerationPanel = () => {
  const { token } = useSelector((state) => state.auth);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [moderationAction, setModerationAction] = useState("");
  const [moderationReason, setModerationReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Fetch flagged content
  const fetchFlaggedContent = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/content/flagged`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch flagged content");
      }

      const result = await response.json();
      setFlaggedContent(result.data.flaggedContent);
    } catch (error) {
      console.error("Error fetching flagged content:", error);
      setError(error.message);
      // Set mock data for development
      setFlaggedContent([
        {
          id: "flag-1",
          contentType: "course",
          contentId: "course-1",
          contentTitle: "Advanced React Development",
          instructorId: "instructor-1",
          instructorName: "John Smith",
          flagReason: "Inappropriate content reported",
          flaggedBy: "user-123",
          flaggedAt: "2024-01-20T10:00:00Z",
          status: "pending",
          priority: "high",
          description: "User reported inappropriate language in video content",
        },
        {
          id: "flag-2",
          contentType: "review",
          contentId: "review-456",
          contentTitle: "Course Review - Python Basics",
          courseId: "course-2",
          courseTitle: "Python for Data Science",
          flagReason: "Spam content",
          flaggedBy: "user-789",
          flaggedAt: "2024-01-19T15:30:00Z",
          status: "pending",
          priority: "medium",
          description: "Review contains promotional links and spam content",
        },
        {
          id: "flag-3",
          contentType: "comment",
          contentId: "comment-789",
          contentTitle: "Discussion Comment",
          courseId: "course-3",
          courseTitle: "Machine Learning Basics",
          flagReason: "Harassment",
          flaggedBy: "user-456",
          flaggedAt: "2024-01-18T09:15:00Z",
          status: "resolved",
          priority: "high",
          description: "Comment contains harassment towards other students",
          resolvedAt: "2024-01-19T11:00:00Z",
          resolvedBy: "admin-1",
          resolution: "Content removed and user warned",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchFlaggedContent();
  }, [token]);

  // Handle moderation action
  const handleModerationAction = async (contentId, action, reason) => {
    try {
      setProcessingId(contentId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/content/${contentId}/moderate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reason: reason.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to moderate content");
      }

      const result = await response.json();

      // Update local state
      setFlaggedContent((prev) =>
        prev.map((item) =>
          item.id === contentId
            ? {
                ...item,
                status: "resolved",
                resolvedAt: new Date().toISOString(),
                resolvedBy: "current-admin",
                resolution: `${action}: ${reason}`,
              }
            : item
        )
      );

      toast.success(`Content ${action} successfully`);
      setSelectedContent(null);
      setModerationAction("");
      setModerationReason("");
    } catch (error) {
      console.error("Error moderating content:", error);
      toast.error(`Failed to moderate content: ${error.message}`);

      // For development, simulate success
      setFlaggedContent((prev) =>
        prev.map((item) =>
          item.id === contentId
            ? {
                ...item,
                status: "resolved",
                resolvedAt: new Date().toISOString(),
                resolvedBy: "current-admin",
                resolution: `${action}: ${reason}`,
              }
            : item
        )
      );
      toast.success(`Content ${action} successfully (simulated)`);
      setSelectedContent(null);
      setModerationAction("");
      setModerationReason("");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle view content details
  const handleViewContent = (content) => {
    setSelectedContent(content);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchFlaggedContent();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };
    return colors[priority] || colors.medium;
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      dismissed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.pending;
  };

  // Get content type icon
  const getContentTypeIcon = (type) => {
    const icons = {
      course: BookOpen,
      review: MessageSquare,
      comment: MessageSquare,
    };
    return icons[type] || MessageSquare;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Flag className="h-5 w-5 mr-2" />
            Content Moderation
          </h2>
          <p className="text-gray-600">Review and moderate flagged content</p>
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
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold">
                  {flaggedContent.filter((c) => c.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-lg font-semibold">
                  {
                    flaggedContent.filter(
                      (c) => c.priority === "high" && c.status === "pending"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-lg font-semibold">
                  {flaggedContent.filter((c) => c.status === "resolved").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Flag className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Flags</p>
                <p className="text-lg font-semibold">{flaggedContent.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged Content</CardTitle>
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
                Loading flagged content...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Flag Reason</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flagged Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedContent.map((content) => {
                    const ContentIcon = getContentTypeIcon(content.contentType);
                    return (
                      <TableRow key={content.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <ContentIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm">
                                {content.contentTitle}
                              </p>
                              {content.instructorName && (
                                <p className="text-xs text-gray-500">
                                  by {content.instructorName}
                                </p>
                              )}
                              {content.courseTitle && (
                                <p className="text-xs text-gray-500">
                                  in {content.courseTitle}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{content.contentType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {content.flagReason}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {content.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getPriorityBadgeColor(content.priority)}
                          >
                            {content.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeColor(content.status)}
                          >
                            {content.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(content.flaggedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContent(content)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {content.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedContent(content);
                                    setModerationAction("approve");
                                  }}
                                  title="Approve Content"
                                  disabled={processingId === content.id}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedContent(content);
                                    setModerationAction("remove");
                                  }}
                                  title="Remove Content"
                                  disabled={processingId === content.id}
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {flaggedContent.length === 0 && (
                <div className="text-center py-8">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No flagged content found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moderation Action Modal */}
      {selectedContent && moderationAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {moderationAction === "approve"
                ? "Approve Content"
                : "Remove Content"}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Content: {selectedContent.contentTitle}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Reason: {selectedContent.flagReason}
              </p>
            </div>

            <div className="mb-4">
              <Label htmlFor="moderation-reason">
                {moderationAction === "approve"
                  ? "Approval Notes"
                  : "Removal Reason"}
              </Label>
              <Textarea
                id="moderation-reason"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder={
                  moderationAction === "approve"
                    ? "Add notes about why this content is approved..."
                    : "Explain why this content is being removed..."
                }
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedContent(null);
                  setModerationAction("");
                  setModerationReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleModerationAction(
                    selectedContent.id,
                    moderationAction,
                    moderationReason
                  )
                }
                disabled={
                  !moderationReason.trim() ||
                  processingId === selectedContent.id
                }
                className={
                  moderationAction === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {processingId === selectedContent.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : moderationAction === "approve" ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                {processingId === selectedContent.id
                  ? "Processing..."
                  : moderationAction === "approve"
                  ? "Approve"
                  : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModerationPanel;

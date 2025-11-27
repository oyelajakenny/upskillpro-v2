"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const AnnouncementModal = ({ announcement, onClose, onUpdate }) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info",
    targetAudience: "all",
    targetRoles: [],
    status: "draft",
    scheduledFor: "",
    expiresAt: "",
    channels: ["in_app"],
    priority: "normal",
  });

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || "",
        content: announcement.content || "",
        type: announcement.type || "info",
        targetAudience: announcement.targetAudience || "all",
        targetRoles: announcement.targetRoles || [],
        status: announcement.status || "draft",
        scheduledFor: announcement.scheduledFor || "",
        expiresAt: announcement.expiresAt || "",
        channels: announcement.channels || ["in_app"],
        priority: announcement.priority || "normal",
      });
    }
  }, [announcement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name === "channels") {
        setFormData((prev) => ({
          ...prev,
          channels: checked
            ? [...prev.channels, value]
            : prev.channels.filter((c) => c !== value),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = announcement
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/communications/announcements/${announcement.announcementId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/communications/announcements`;

      const method = announcement ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${announcement ? "update" : "create"} announcement`
        );
      }

      onUpdate();
      onClose();
    } catch (err) {
      console.error("Error saving announcement:", err);
      alert(`Failed to ${announcement ? "update" : "create"} announcement`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {announcement ? "Edit" : "Create"} Announcement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Audience
              </label>
              <select
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="students">Students Only</option>
                <option value="instructors">Instructors Only</option>
                <option value="specific">Specific Users</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {formData.status === "scheduled" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Schedule For
              </label>
              <input
                type="datetime-local"
                name="scheduledFor"
                value={formData.scheduledFor}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Delivery Channels
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="channels"
                  value="in_app"
                  checked={formData.channels.includes("in_app")}
                  onChange={handleChange}
                  className="mr-2"
                />
                In-App Notification
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="channels"
                  value="email"
                  checked={formData.channels.includes("email")}
                  onChange={handleChange}
                  className="mr-2"
                />
                Email
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="channels"
                  value="dashboard"
                  checked={formData.channels.includes("dashboard")}
                  onChange={handleChange}
                  className="mr-2"
                />
                Dashboard Alert
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading
                ? "Saving..."
                : announcement
                ? "Update Announcement"
                : "Create Announcement"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;

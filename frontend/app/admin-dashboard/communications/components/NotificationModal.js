"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const NotificationModal = ({ onClose, onSend }) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    targetType: "roles",
    targetUserIds: "",
    targetRoles: [],
    channels: ["in_app"],
  });

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
      } else if (name === "targetRoles") {
        setFormData((prev) => ({
          ...prev,
          targetRoles: checked
            ? [...prev.targetRoles, value]
            : prev.targetRoles.filter((r) => r !== value),
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
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        channels: formData.channels,
      };

      if (formData.targetType === "users" && formData.targetUserIds) {
        payload.targetUserIds = formData.targetUserIds
          .split(",")
          .map((id) => id.trim());
      } else if (formData.targetType === "roles") {
        payload.targetRoles = formData.targetRoles;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/communications/notifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      onSend();
      onClose();
      alert("Notification sent successfully!");
    } catch (err) {
      console.error("Error sending notification:", err);
      alert("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Send Targeted Notification</h2>
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
              placeholder="Notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notification message"
            />
          </div>

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
            <label className="block text-sm font-medium mb-2">
              Target Type
            </label>
            <select
              name="targetType"
              value={formData.targetType}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="roles">By Role</option>
              <option value="users">Specific Users</option>
            </select>
          </div>

          {formData.targetType === "roles" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Roles <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="targetRoles"
                    value="student"
                    checked={formData.targetRoles.includes("student")}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Students
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="targetRoles"
                    value="instructor"
                    checked={formData.targetRoles.includes("instructor")}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Instructors
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="targetRoles"
                    value="super_admin"
                    checked={formData.targetRoles.includes("super_admin")}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Admins
                </label>
              </div>
            </div>
          )}

          {formData.targetType === "users" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                User IDs (comma-separated){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="targetUserIds"
                value={formData.targetUserIds}
                onChange={handleChange}
                required={formData.targetType === "users"}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user1, user2, user3"
              />
            </div>
          )}

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
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Sending..." : "Send Notification"}
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

export default NotificationModal;

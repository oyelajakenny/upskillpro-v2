"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const TemplateModal = ({ onClose, onCreate }) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "general",
    subject: "",
    body: "",
    variables: "",
    channels: ["email"],
    isActive: true,
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
      } else if (name === "isActive") {
        setFormData((prev) => ({
          ...prev,
          isActive: checked,
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
        ...formData,
        variables: formData.variables
          ? formData.variables.split(",").map((v) => v.trim())
          : [],
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/communications/templates`,
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
        throw new Error("Failed to create template");
      }

      onCreate();
      onClose();
    } catch (err) {
      console.error("Error creating template:", err);
      alert("Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Create Notification Template</h2>
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
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Welcome Email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="welcome">Welcome</option>
              <option value="notification">Notification</option>
              <option value="reminder">Reminder</option>
              <option value="alert">Alert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email subject line"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Template body. Use {{variableName}} for dynamic content."
            />
            <p className="text-xs text-gray-500 mt-1">
              Use double curly braces for variables, e.g., {"{{userName}}"},{" "}
              {"{{courseName}}"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Variables (comma-separated)
            </label>
            <input
              type="text"
              name="variables"
              value={formData.variables}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., userName, courseName, date"
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
                  value="in_app"
                  checked={formData.channels.includes("in_app")}
                  onChange={handleChange}
                  className="mr-2"
                />
                In-App Notification
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium">Active Template</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Template"}
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

export default TemplateModal;

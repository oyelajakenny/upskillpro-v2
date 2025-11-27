"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, AlertCircle, Flag } from "lucide-react";

const FeatureFlagsTab = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState({
    enableCourseReviews: settings?.enableCourseReviews || true,
    enableCertificates: settings?.enableCertificates || true,
    enableDiscussionForums: settings?.enableDiscussionForums || true,
    enableLiveStreaming: settings?.enableLiveStreaming || false,
    enableAIRecommendations: settings?.enableAIRecommendations || false,
    enableCourseWishlist: settings?.enableCourseWishlist || true,
    enableCoursePreview: settings?.enableCoursePreview || true,
    enableMobileApp: settings?.enableMobileApp || false,
    enableSocialLogin: settings?.enableSocialLogin || true,
    enableNotifications: settings?.enableNotifications || true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/settings/features", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featureFlags: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update feature flags");
      }

      const data = await response.json();
      setSuccess(true);
      onUpdate(data.data);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating feature flags:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const featureCategories = [
    {
      title: "Course Features",
      description: "Features related to course functionality",
      features: [
        {
          key: "enableCourseReviews",
          label: "Course Reviews",
          description: "Allow students to rate and review courses",
        },
        {
          key: "enableCertificates",
          label: "Certificates",
          description: "Generate completion certificates for courses",
        },
        {
          key: "enableCourseWishlist",
          label: "Course Wishlist",
          description: "Allow users to save courses to a wishlist",
        },
        {
          key: "enableCoursePreview",
          label: "Course Preview",
          description:
            "Allow users to preview course content before purchasing",
        },
      ],
    },
    {
      title: "Communication Features",
      description: "Features for user interaction and communication",
      features: [
        {
          key: "enableDiscussionForums",
          label: "Discussion Forums",
          description: "Enable course discussion forums and Q&A",
        },
        {
          key: "enableLiveStreaming",
          label: "Live Streaming",
          description: "Enable live streaming capabilities for instructors",
        },
        {
          key: "enableNotifications",
          label: "Notifications",
          description: "Send email and in-app notifications to users",
        },
      ],
    },
    {
      title: "Advanced Features",
      description: "Advanced platform capabilities",
      features: [
        {
          key: "enableAIRecommendations",
          label: "AI Recommendations",
          description: "Use AI to recommend courses to users",
        },
        {
          key: "enableMobileApp",
          label: "Mobile App",
          description: "Enable mobile app functionality and API access",
        },
        {
          key: "enableSocialLogin",
          label: "Social Login",
          description:
            "Allow login with Google, Facebook, and other social providers",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Feature Flags</h3>
        <p className="text-sm text-gray-600 mt-1">
          Enable or disable platform features and functionality
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>
            Feature flags updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {featureCategories.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="h-5 w-5" />
                <span>{category.title}</span>
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.features.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="space-y-1">
                    <Label
                      htmlFor={feature.key}
                      className="text-sm font-medium"
                    >
                      {feature.label}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                  <Switch
                    id={feature.key}
                    checked={formData[feature.key]}
                    onCheckedChange={(checked) =>
                      handleToggle(feature.key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FeatureFlagsTab;

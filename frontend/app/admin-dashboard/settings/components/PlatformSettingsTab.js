"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, AlertCircle } from "lucide-react";

const PlatformSettingsTab = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState({
    platformName: settings?.platformName || "UpSkillPro",
    maintenanceMode: settings?.maintenanceMode || false,
    allowUserRegistration: settings?.allowUserRegistration || true,
    requireCourseApproval: settings?.requireCourseApproval || true,
    maxFileUploadSize: settings?.maxFileUploadSize || 100,
    supportEmail: settings?.supportEmail || "support@upskillpro.com",
    defaultLanguage: settings?.defaultLanguage || "en",
    maintenanceMessage:
      settings?.maintenanceMessage ||
      "The platform is currently under maintenance. Please check back later.",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field, value) => {
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

      const response = await fetch("/api/admin/settings/platform", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update platform settings"
        );
      }

      const data = await response.json();
      setSuccess(true);
      onUpdate(data.data);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating platform settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Platform Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure basic platform settings and behavior
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
            Platform settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Platform Name */}
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              value={formData.platformName}
              onChange={(e) =>
                handleInputChange("platformName", e.target.value)
              }
              placeholder="Enter platform name"
            />
          </div>

          {/* Support Email */}
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={(e) =>
                handleInputChange("supportEmail", e.target.value)
              }
              placeholder="support@example.com"
            />
          </div>

          {/* Default Language */}
          <div className="space-y-2">
            <Label htmlFor="defaultLanguage">Default Language</Label>
            <select
              id="defaultLanguage"
              value={formData.defaultLanguage}
              onChange={(e) =>
                handleInputChange("defaultLanguage", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
            </select>
          </div>

          {/* Max File Upload Size */}
          <div className="space-y-2">
            <Label htmlFor="maxFileUploadSize">Max File Upload Size (MB)</Label>
            <Input
              id="maxFileUploadSize"
              type="number"
              min="1"
              max="1000"
              value={formData.maxFileUploadSize}
              onChange={(e) =>
                handleInputChange("maxFileUploadSize", parseInt(e.target.value))
              }
            />
          </div>
        </div>

        {/* Maintenance Message */}
        <div className="space-y-2">
          <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
          <Textarea
            id="maintenanceMessage"
            value={formData.maintenanceMessage}
            onChange={(e) =>
              handleInputChange("maintenanceMessage", e.target.value)
            }
            placeholder="Message to display when platform is in maintenance mode"
            rows={3}
          />
        </div>

        {/* Toggle Settings */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">
            Platform Behavior
          </h4>

          <div className="space-y-4">
            {/* Maintenance Mode */}
            <Card
              className={
                formData.maintenanceMode ? "border-orange-200 bg-orange-50" : ""
              }
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="maintenanceMode"
                      className="text-sm font-medium"
                    >
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-gray-600">
                      When enabled, the platform will be inaccessible to regular
                      users
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={formData.maintenanceMode}
                    onCheckedChange={(checked) =>
                      handleInputChange("maintenanceMode", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* User Registration */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="allowUserRegistration"
                      className="text-sm font-medium"
                    >
                      Allow User Registration
                    </Label>
                    <p className="text-sm text-gray-600">
                      Allow new users to register for accounts
                    </p>
                  </div>
                  <Switch
                    id="allowUserRegistration"
                    checked={formData.allowUserRegistration}
                    onCheckedChange={(checked) =>
                      handleInputChange("allowUserRegistration", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Course Approval */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="requireCourseApproval"
                      className="text-sm font-medium"
                    >
                      Require Course Approval
                    </Label>
                    <p className="text-sm text-gray-600">
                      New courses must be approved by administrators before
                      being published
                    </p>
                  </div>
                  <Switch
                    id="requireCourseApproval"
                    checked={formData.requireCourseApproval}
                    onCheckedChange={(checked) =>
                      handleInputChange("requireCourseApproval", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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

export default PlatformSettingsTab;

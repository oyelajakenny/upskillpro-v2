"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Loader2,
  Save,
  AlertCircle,
  Plug,
  Mail,
  Database,
  BarChart,
} from "lucide-react";

const IntegrationSettingsTab = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState({
    emailProvider: settings?.emailProvider || "sendgrid",
    emailApiKey: settings?.emailApiKey || "",
    storageProvider: settings?.storageProvider || "aws-s3",
    storageConfig: settings?.storageConfig || {},
    analyticsProvider: settings?.analyticsProvider || "google-analytics",
    analyticsTrackingId: settings?.analyticsTrackingId || "",
    enableWebhooks: settings?.enableWebhooks || true,
    webhookUrl: settings?.webhookUrl || "",
    enableSSOIntegration: settings?.enableSSOIntegration || false,
    ssoProvider: settings?.ssoProvider || "saml",
    ssoConfig: settings?.ssoConfig || {},
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

      const response = await fetch("/api/admin/settings/integrations", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ integrationSettings: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update integration settings"
        );
      }

      const data = await response.json();
      setSuccess(true);
      onUpdate(data.data);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating integration settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const emailProviders = [
    { value: "sendgrid", label: "SendGrid" },
    { value: "mailgun", label: "Mailgun" },
    { value: "ses", label: "Amazon SES" },
    { value: "smtp", label: "Custom SMTP" },
  ];

  const storageProviders = [
    { value: "aws-s3", label: "Amazon S3" },
    { value: "google-cloud", label: "Google Cloud Storage" },
    { value: "azure-blob", label: "Azure Blob Storage" },
    { value: "local", label: "Local Storage" },
  ];

  const analyticsProviders = [
    { value: "google-analytics", label: "Google Analytics" },
    { value: "mixpanel", label: "Mixpanel" },
    { value: "amplitude", label: "Amplitude" },
    { value: "custom", label: "Custom Analytics" },
  ];

  const ssoProviders = [
    { value: "saml", label: "SAML 2.0" },
    { value: "oauth2", label: "OAuth 2.0" },
    { value: "ldap", label: "LDAP" },
    { value: "azure-ad", label: "Azure Active Directory" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Integration Settings
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure third-party integrations and external services
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
            Integration settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Service Integration</span>
            </CardTitle>
            <CardDescription>
              Configure email service provider for notifications and
              communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailProvider">Email Provider</Label>
                <select
                  id="emailProvider"
                  value={formData.emailProvider}
                  onChange={(e) =>
                    handleInputChange("emailProvider", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {emailProviders.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailApiKey">API Key</Label>
                <Input
                  id="emailApiKey"
                  type="password"
                  value={formData.emailApiKey}
                  onChange={(e) =>
                    handleInputChange("emailApiKey", e.target.value)
                  }
                  placeholder="Enter API key"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Storage Service Integration</span>
            </CardTitle>
            <CardDescription>
              Configure cloud storage provider for file uploads and media
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storageProvider">Storage Provider</Label>
              <select
                id="storageProvider"
                value={formData.storageProvider}
                onChange={(e) =>
                  handleInputChange("storageProvider", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {storageProviders.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.storageProvider === "aws-s3" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label>S3 Bucket Name</Label>
                  <Input
                    value={formData.storageConfig?.bucketName || ""}
                    onChange={(e) =>
                      handleInputChange("storageConfig", {
                        ...formData.storageConfig,
                        bucketName: e.target.value,
                      })
                    }
                    placeholder="my-bucket-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>AWS Region</Label>
                  <Input
                    value={formData.storageConfig?.region || ""}
                    onChange={(e) =>
                      handleInputChange("storageConfig", {
                        ...formData.storageConfig,
                        region: e.target.value,
                      })
                    }
                    placeholder="us-east-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="h-5 w-5" />
              <span>Analytics Integration</span>
            </CardTitle>
            <CardDescription>
              Configure analytics provider for tracking user behavior and
              platform metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="analyticsProvider">Analytics Provider</Label>
                <select
                  id="analyticsProvider"
                  value={formData.analyticsProvider}
                  onChange={(e) =>
                    handleInputChange("analyticsProvider", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {analyticsProviders.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="analyticsTrackingId">Tracking ID</Label>
                <Input
                  id="analyticsTrackingId"
                  value={formData.analyticsTrackingId}
                  onChange={(e) =>
                    handleInputChange("analyticsTrackingId", e.target.value)
                  }
                  placeholder="GA-XXXXXXXXX-X"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plug className="h-5 w-5" />
              <span>Webhook Integration</span>
            </CardTitle>
            <CardDescription>
              Configure webhooks for real-time event notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableWebhooks" className="text-sm font-medium">
                  Enable Webhooks
                </Label>
                <p className="text-sm text-gray-600">
                  Send HTTP notifications for platform events
                </p>
              </div>
              <Switch
                id="enableWebhooks"
                checked={formData.enableWebhooks}
                onCheckedChange={(checked) =>
                  handleInputChange("enableWebhooks", checked)
                }
              />
            </div>

            {formData.enableWebhooks && (
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) =>
                    handleInputChange("webhookUrl", e.target.value)
                  }
                  placeholder="https://your-app.com/webhooks"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* SSO Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Single Sign-On (SSO) Integration</CardTitle>
            <CardDescription>
              Configure SSO for enterprise authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="enableSSOIntegration"
                  className="text-sm font-medium"
                >
                  Enable SSO Integration
                </Label>
                <p className="text-sm text-gray-600">
                  Allow users to authenticate using enterprise SSO
                </p>
              </div>
              <Switch
                id="enableSSOIntegration"
                checked={formData.enableSSOIntegration}
                onCheckedChange={(checked) =>
                  handleInputChange("enableSSOIntegration", checked)
                }
              />
            </div>

            {formData.enableSSOIntegration && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ssoProvider">SSO Provider</Label>
                  <select
                    id="ssoProvider"
                    value={formData.ssoProvider}
                    onChange={(e) =>
                      handleInputChange("ssoProvider", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ssoProviders.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    SSO configuration requires additional setup. Please contact
                    support for assistance.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

export default IntegrationSettingsTab;

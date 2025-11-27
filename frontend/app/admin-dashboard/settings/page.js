"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Settings, Shield, CreditCard, Plug } from "lucide-react";
import PlatformSettingsTab from "./components/PlatformSettingsTab";
import FeatureFlagsTab from "./components/FeatureFlagsTab";
import PaymentSettingsTab from "./components/PaymentSettingsTab";
import IntegrationSettingsTab from "./components/IntegrationSettingsTab";
import SecurityPoliciesTab from "./components/SecurityPoliciesTab";

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("platform");

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch system settings");
      }

      const data = await response.json();
      setSettings(data.data);
    } catch (err) {
      console.error("Error fetching system settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = (updatedSettings) => {
    setSettings(updatedSettings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading system settings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading system settings: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure platform settings, security policies, and integrations
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0">
                <TabsTrigger
                  value="platform"
                  className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <Settings className="h-4 w-4" />
                  <span>Platform</span>
                </TabsTrigger>
                <TabsTrigger
                  value="features"
                  className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <Settings className="h-4 w-4" />
                  <span>Features</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Payment</span>
                </TabsTrigger>
                <TabsTrigger
                  value="integrations"
                  className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <Plug className="h-4 w-4" />
                  <span>Integrations</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700"
                >
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
              </TabsList>
            </div>
            // Add keys to TabsContent components and ensure proper conditional
            rendering
            <div className="p-6">
              <TabsContent value="platform" className="mt-0" key="platform">
                {settings && (
                  <PlatformSettingsTab
                    settings={settings?.platformSettings}
                    onUpdate={handleSettingsUpdate}
                  />
                )}
              </TabsContent>

              <TabsContent value="features" className="mt-0" key="features">
                {settings && (
                  <FeatureFlagsTab
                    settings={settings?.featureFlags}
                    onUpdate={handleSettingsUpdate}
                  />
                )}
              </TabsContent>

              <TabsContent value="payment" className="mt-0" key="payment">
                {settings && (
                  <PaymentSettingsTab
                    settings={settings?.paymentSettings}
                    onUpdate={handleSettingsUpdate}
                  />
                )}
              </TabsContent>

              <TabsContent
                value="integrations"
                className="mt-0"
                key="integrations"
              >
                {settings && (
                  <IntegrationSettingsTab
                    settings={settings?.integrationSettings}
                    onUpdate={handleSettingsUpdate}
                  />
                )}
              </TabsContent>

              <TabsContent value="security" className="mt-0" key="security">
                <SecurityPoliciesTab onUpdate={handleSettingsUpdate} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettingsPage;

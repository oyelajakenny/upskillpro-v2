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
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";

const PaymentSettingsTab = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState({
    provider: settings?.provider || "stripe",
    currency: settings?.currency || "USD",
    commissionRate: settings?.commissionRate || 15,
    enableRefunds: settings?.enableRefunds || true,
    refundPeriodDays: settings?.refundPeriodDays || 30,
    apiKey: settings?.apiKey || "",
    secretKey: settings?.secretKey || "",
    webhookSecret: settings?.webhookSecret || "",
    testMode: settings?.testMode || true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    apiKey: false,
    secretKey: false,
    webhookSecret: false,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccess(false);
  };

  const toggleSecretVisibility = (field) => {
    setShowSecrets((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.provider || !formData.currency) {
      setError("Provider and currency are required");
      return;
    }

    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      setError("Commission rate must be between 0 and 100");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/settings/payment", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentSettings: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update payment settings"
        );
      }

      const data = await response.json();
      setSuccess(true);
      onUpdate(data.data);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating payment settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const paymentProviders = [
    { value: "stripe", label: "Stripe" },
    { value: "paypal", label: "PayPal" },
    { value: "square", label: "Square" },
  ];

  const currencies = [
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "British Pound (GBP)" },
    { value: "CAD", label: "Canadian Dollar (CAD)" },
    { value: "AUD", label: "Australian Dollar (AUD)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Payment Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure payment gateway settings and commission rates
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
            Payment settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Basic Payment Settings</span>
            </CardTitle>
            <CardDescription>
              Configure the primary payment provider and currency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Provider */}
              <div className="space-y-2">
                <Label htmlFor="provider">Payment Provider</Label>
                <select
                  id="provider"
                  value={formData.provider}
                  onChange={(e) =>
                    handleInputChange("provider", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentProviders.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    handleInputChange("currency", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commission Rate */}
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={(e) =>
                    handleInputChange(
                      "commissionRate",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>

              {/* Refund Period */}
              <div className="space-y-2">
                <Label htmlFor="refundPeriodDays">Refund Period (Days)</Label>
                <Input
                  id="refundPeriodDays"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.refundPeriodDays}
                  onChange={(e) =>
                    handleInputChange(
                      "refundPeriodDays",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="enableRefunds"
                    className="text-sm font-medium"
                  >
                    Enable Refunds
                  </Label>
                  <p className="text-sm text-gray-600">
                    Allow students to request refunds for courses
                  </p>
                </div>
                <Switch
                  id="enableRefunds"
                  checked={formData.enableRefunds}
                  onCheckedChange={(checked) =>
                    handleInputChange("enableRefunds", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="testMode" className="text-sm font-medium">
                    Test Mode
                  </Label>
                  <p className="text-sm text-gray-600">
                    Use test API keys and sandbox environment
                  </p>
                </div>
                <Switch
                  id="testMode"
                  checked={formData.testMode}
                  onCheckedChange={(checked) =>
                    handleInputChange("testMode", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure API keys and webhook settings for your payment provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {formData.testMode ? "Test API Key" : "Live API Key"}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showSecrets.apiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => handleInputChange("apiKey", e.target.value)}
                  placeholder="pk_test_... or pk_live_..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => toggleSecretVisibility("apiKey")}
                >
                  {showSecrets.apiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <Label htmlFor="secretKey">
                {formData.testMode ? "Test Secret Key" : "Live Secret Key"}
              </Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecrets.secretKey ? "text" : "password"}
                  value={formData.secretKey}
                  onChange={(e) =>
                    handleInputChange("secretKey", e.target.value)
                  }
                  placeholder="sk_test_... or sk_live_..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => toggleSecretVisibility("secretKey")}
                >
                  {showSecrets.secretKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <div className="relative">
                <Input
                  id="webhookSecret"
                  type={showSecrets.webhookSecret ? "text" : "password"}
                  value={formData.webhookSecret}
                  onChange={(e) =>
                    handleInputChange("webhookSecret", e.target.value)
                  }
                  placeholder="whsec_..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => toggleSecretVisibility("webhookSecret")}
                >
                  {showSecrets.webhookSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
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

export default PaymentSettingsTab;

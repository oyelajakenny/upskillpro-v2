"use client";

import { useState, useEffect } from "react";
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
import {
  Loader2,
  Save,
  AlertCircle,
  Shield,
  Lock,
  Clock,
  Globe,
} from "lucide-react";

const SecurityPoliciesTab = ({ onUpdate }) => {
  const [policies, setPolicies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSecurityPolicies();
  }, []);

  const fetchSecurityPolicies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/security/policies", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch security policies");
      }

      const data = await response.json();
      setPolicies(data.data);
    } catch (err) {
      console.error("Error fetching security policies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyChange = (category, field, value) => {
    setPolicies((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
    setError(null);
    setSuccess(false);
  };

  const handleArrayChange = (category, field, index, value) => {
    setPolicies((prev) => {
      const newArray = [...(prev[category][field] || [])];
      if (value === "") {
        newArray.splice(index, 1);
      } else {
        newArray[index] = value;
      }
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [field]: newArray,
        },
      };
    });
  };

  const addArrayItem = (category, field) => {
    setPolicies((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: [...(prev[category][field] || []), ""],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/security/policies", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ policies }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update security policies"
        );
      }

      const data = await response.json();
      setSuccess(true);
      onUpdate(data.data);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating security policies:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading security policies...</span>
        </div>
      </div>
    );
  }

  if (!policies) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load security policies. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Security Policies
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure security policies, password requirements, and access
          controls
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
            Security policies updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Password Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Password Policy</span>
            </CardTitle>
            <CardDescription>
              Configure password requirements and security rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minLength">Minimum Length</Label>
                <Input
                  id="minLength"
                  type="number"
                  min="6"
                  max="50"
                  value={policies.passwordPolicy?.minLength || 8}
                  onChange={(e) =>
                    handlePolicyChange(
                      "passwordPolicy",
                      "minLength",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAge">Maximum Age (Days)</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min="1"
                  max="365"
                  value={policies.passwordPolicy?.maxAge || 90}
                  onChange={(e) =>
                    handlePolicyChange(
                      "passwordPolicy",
                      "maxAge",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preventReuse">
                  Prevent Reuse (Last N passwords)
                </Label>
                <Input
                  id="preventReuse"
                  type="number"
                  min="1"
                  max="20"
                  value={policies.passwordPolicy?.preventReuse || 5}
                  onChange={(e) =>
                    handlePolicyChange(
                      "passwordPolicy",
                      "preventReuse",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">
                Password Requirements
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireUppercase" className="text-sm">
                    Require Uppercase Letters
                  </Label>
                  <Switch
                    id="requireUppercase"
                    checked={policies.passwordPolicy?.requireUppercase || false}
                    onCheckedChange={(checked) =>
                      handlePolicyChange(
                        "passwordPolicy",
                        "requireUppercase",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requireLowercase" className="text-sm">
                    Require Lowercase Letters
                  </Label>
                  <Switch
                    id="requireLowercase"
                    checked={policies.passwordPolicy?.requireLowercase || false}
                    onCheckedChange={(checked) =>
                      handlePolicyChange(
                        "passwordPolicy",
                        "requireLowercase",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requireNumbers" className="text-sm">
                    Require Numbers
                  </Label>
                  <Switch
                    id="requireNumbers"
                    checked={policies.passwordPolicy?.requireNumbers || false}
                    onCheckedChange={(checked) =>
                      handlePolicyChange(
                        "passwordPolicy",
                        "requireNumbers",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requireSpecialChars" className="text-sm">
                    Require Special Characters
                  </Label>
                  <Switch
                    id="requireSpecialChars"
                    checked={
                      policies.passwordPolicy?.requireSpecialChars || false
                    }
                    onCheckedChange={(checked) =>
                      handlePolicyChange(
                        "passwordPolicy",
                        "requireSpecialChars",
                        checked
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Session Management</span>
            </CardTitle>
            <CardDescription>
              Configure session timeouts and concurrent session limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Maximum Duration (Hours)</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  min="1"
                  max="168"
                  value={policies.sessionPolicy?.maxDuration || 24}
                  onChange={(e) =>
                    handlePolicyChange(
                      "sessionPolicy",
                      "maxDuration",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idleTimeout">Idle Timeout (Hours)</Label>
                <Input
                  id="idleTimeout"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={policies.sessionPolicy?.idleTimeout || 2}
                  onChange={(e) =>
                    handlePolicyChange(
                      "sessionPolicy",
                      "idleTimeout",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxConcurrentSessions">
                  Max Concurrent Sessions
                </Label>
                <Input
                  id="maxConcurrentSessions"
                  type="number"
                  min="1"
                  max="10"
                  value={policies.sessionPolicy?.maxConcurrentSessions || 3}
                  onChange={(e) =>
                    handlePolicyChange(
                      "sessionPolicy",
                      "maxConcurrentSessions",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="requireMFA" className="text-sm font-medium">
                      Require Multi-Factor Authentication
                    </Label>
                    <p className="text-xs text-gray-600">
                      Require MFA for all user accounts
                    </p>
                  </div>
                  <Switch
                    id="requireMFA"
                    checked={policies.sessionPolicy?.requireMFA || false}
                    onCheckedChange={(checked) =>
                      handlePolicyChange("sessionPolicy", "requireMFA", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="allowConcurrentSessions"
                      className="text-sm font-medium"
                    >
                      Allow Concurrent Sessions
                    </Label>
                    <p className="text-xs text-gray-600">
                      Allow users to have multiple active sessions
                    </p>
                  </div>
                  <Switch
                    id="allowConcurrentSessions"
                    checked={
                      policies.sessionPolicy?.allowConcurrentSessions || false
                    }
                    onCheckedChange={(checked) =>
                      handlePolicyChange(
                        "sessionPolicy",
                        "allowConcurrentSessions",
                        checked
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Access Control</span>
            </CardTitle>
            <CardDescription>
              Configure IP whitelisting, rate limiting, and brute force
              protection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRequestsPerMinute">
                  Max Requests/Minute
                </Label>
                <Input
                  id="maxRequestsPerMinute"
                  type="number"
                  min="10"
                  max="1000"
                  value={policies.accessControl?.maxRequestsPerMinute || 100}
                  onChange={(e) =>
                    handlePolicyChange(
                      "accessControl",
                      "maxRequestsPerMinute",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxFailedAttempts">Max Failed Attempts</Label>
                <Input
                  id="maxFailedAttempts"
                  type="number"
                  min="3"
                  max="20"
                  value={policies.accessControl?.maxFailedAttempts || 5}
                  onChange={(e) =>
                    handlePolicyChange(
                      "accessControl",
                      "maxFailedAttempts",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">
                  Lockout Duration (Minutes)
                </Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  min="5"
                  max="1440"
                  value={policies.accessControl?.lockoutDuration || 30}
                  onChange={(e) =>
                    handlePolicyChange(
                      "accessControl",
                      "lockoutDuration",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="enableIPWhitelist"
                      className="text-sm font-medium"
                    >
                      Enable IP Whitelisting
                    </Label>
                    <p className="text-xs text-gray-600">
                      Restrict access to specific IP addresses
                    </p>
                  </div>
                  <Switch
                    id="enableIPWhitelist"
                    checked={policies.accessControl?.enableIPWhitelist || false}
                    onCheckedChange={(checked) =>
                      handlePolicyChange(
                        "accessControl",
                        "enableIPWhitelist",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="enableRateLimit"
                      className="text-sm font-medium"
                    >
                      Enable Rate Limiting
                    </Label>
                    <p className="text-xs text-gray-600">
                      Limit the number of requests per user
                    </p>
                  </div>
                  <Switch
                    id="enableRateLimit"
                    checked={policies.accessControl?.enableRateLimit || false}
                    onCheckedChange={(checked) =>
                      handlePolicyChange(
                        "accessControl",
                        "enableRateLimit",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="enableBruteForceProtection"
                      className="text-sm font-medium"
                    >
                      Enable Brute Force Protection
                    </Label>
                    <p className="text-xs text-gray-600">
                      Automatically lock accounts after failed attempts
                    </p>
                  </div>
                  <Switch
                    id="enableBruteForceProtection"
                    checked={
                      policies.accessControl?.enableBruteForceProtection ||
                      false
                    }
                    onCheckedChange={(checked) =>
                      handlePolicyChange(
                        "accessControl",
                        "enableBruteForceProtection",
                        checked
                      )
                    }
                  />
                </div>
              </div>

              {policies.accessControl?.enableIPWhitelist && (
                <div className="space-y-2">
                  <Label>Allowed IP Addresses</Label>
                  <div className="space-y-2">
                    {(policies.accessControl?.allowedIPs || []).map(
                      (ip, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <Input
                            value={ip}
                            onChange={(e) =>
                              handleArrayChange(
                                "accessControl",
                                "allowedIPs",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="192.168.1.0/24 or 10.0.0.1"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleArrayChange(
                                "accessControl",
                                "allowedIPs",
                                index,
                                ""
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      )
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        addArrayItem("accessControl", "allowedIPs")
                      }
                    >
                      Add IP Address
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button type="submit" disabled={saving} className="min-w-[120px]">
            {saving ? (
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

export default SecurityPoliciesTab;

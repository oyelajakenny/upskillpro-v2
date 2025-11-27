"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  Eye,
  Activity,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

export default function SecurityMonitoringPage() {
  const [securityData, setSecurityData] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("24");
  const [eventFilter, setEventFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSecurityData();
  }, [timeRange]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch security dashboard data
      const dashboardResponse = await fetch(
        `/api/admin/security/dashboard?hoursBack=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!dashboardResponse.ok) {
        throw new Error("Failed to fetch security dashboard");
      }

      const dashboardData = await dashboardResponse.json();
      setSecurityData(dashboardData.data);

      // Fetch security events
      const eventsResponse = await fetch(
        `/api/admin/security/events?hoursBack=${timeRange}&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!eventsResponse.ok) {
        throw new Error("Failed to fetch security events");
      }

      const eventsData = await eventsResponse.json();
      setSecurityEvents(eventsData.data.securityEvents || []);

      // Fetch suspicious activity
      const suspiciousResponse = await fetch(
        `/api/admin/security/suspicious?hoursBack=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!suspiciousResponse.ok) {
        throw new Error("Failed to fetch suspicious activity");
      }

      const suspiciousData = await suspiciousResponse.json();
      setSuspiciousActivity(suspiciousData.data);
    } catch (err) {
      console.error("Error fetching security data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case "LOGIN_ATTEMPT":
        return <Users className="h-4 w-4" />;
      case "FAILED_LOGIN":
        return <AlertTriangle className="h-4 w-4" />;
      case "SUSPICIOUS_ACTIVITY":
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const filteredEvents = securityEvents.filter((event) => {
    const matchesFilter =
      eventFilter === "all" || event.eventType === eventFilter;
    const matchesSearch =
      !searchTerm ||
      event.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventType?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading security data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor login attempts, failed authentications, and suspicious
            activity
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last Hour</SelectItem>
              <SelectItem value="24">Last 24h</SelectItem>
              <SelectItem value="168">Last Week</SelectItem>
              <SelectItem value="720">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchSecurityData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics Cards */}
      {securityData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Login Attempts
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {securityData.metrics.totalLoginAttempts}
              </div>
              <p className="text-xs text-muted-foreground">
                {securityData.metrics.successfulLogins} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Failed Logins
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {securityData.metrics.failedLoginAttempts}
              </div>
              <p className="text-xs text-muted-foreground">
                {securityData.metrics.loginSuccessRate}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Suspicious Activity
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {securityData.metrics.suspiciousActivityCount}
              </div>
              <p className="text-xs text-muted-foreground">Events detected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Alerts
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {securityData.metrics.activeAlerts}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Alerts */}
      {suspiciousActivity && suspiciousActivity.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suspiciousActivity.alerts.map((alert, index) => (
                <Alert
                  key={index}
                  variant={
                    alert.severity === "HIGH" ? "destructive" : "default"
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm font-medium">
                          {alert.type}
                        </span>
                      </div>
                      <AlertDescription>{alert.description}</AlertDescription>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Events Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Input
              placeholder="Search by user ID, IP address, or event type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="LOGIN_ATTEMPT">Login Attempts</SelectItem>
                <SelectItem value="FAILED_LOGIN">Failed Logins</SelectItem>
                <SelectItem value="SUSPICIOUS_ACTIVITY">
                  Suspicious Activity
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No security events found for the selected criteria.
                  </p>
                ) : (
                  filteredEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getEventTypeIcon(event.eventType)}
                        <div>
                          <div className="font-medium">{event.eventType}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.userId && `User: ${event.userId} • `}
                            IP: {event.ipAddress || "Unknown"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                        {event.details && (
                          <div className="text-xs text-muted-foreground">
                            {JSON.stringify(event.details)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {securityData && securityData.trends ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Analysis period:{" "}
                    {new Date(
                      securityData.trends.analysisPeriod.startDate
                    ).toLocaleString()}{" "}
                    -{" "}
                    {new Date(
                      securityData.trends.analysisPeriod.endDate
                    ).toLocaleString()}
                  </div>

                  {Object.keys(securityData.trends.eventsByHour).length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium">Events by Hour</h4>
                      {Object.entries(securityData.trends.eventsByHour).map(
                        ([hour, counts]) => (
                          <div
                            key={hour}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <span className="text-sm">
                              {new Date(hour).toLocaleString()}
                            </span>
                            <div className="flex gap-4 text-sm">
                              <span>Total: {counts.total}</span>
                              <span className="text-red-600">
                                Failed: {counts.failed}
                              </span>
                              <span className="text-orange-600">
                                Suspicious: {counts.suspicious}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No trend data available for the selected period.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Loading trend data...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

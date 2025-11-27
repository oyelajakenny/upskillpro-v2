"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Activity,
  Database,
  Server,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Clock,
  HardDrive,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SystemHealthPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [databaseHealth, setDatabaseHealth] = useState(null);
  const [apiMetrics, setApiMetrics] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/health?timeRange=1h`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch system health");
      }

      const data = await response.json();
      setSystemHealth(data.data);
    } catch (err) {
      console.error("Error fetching system health:", err);
      throw err;
    }
  };

  const fetchDatabaseHealth = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/database?timeRange=1h`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch database health");
      }

      const data = await response.json();
      setDatabaseHealth(data.data);
    } catch (err) {
      console.error("Error fetching database health:", err);
      throw err;
    }
  };

  const fetchApiMetrics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/api-metrics?timeRange=1h`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch API metrics");
      }

      const data = await response.json();
      setApiMetrics(data.data);
    } catch (err) {
      console.error("Error fetching API metrics:", err);
      throw err;
    }
  };

  const fetchRealtimeMetrics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/system/metrics/realtime`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch realtime metrics");
      }

      const data = await response.json();
      setRealtimeMetrics(data.data);
    } catch (err) {
      console.error("Error fetching realtime metrics:", err);
      throw err;
    }
  };

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      await Promise.all([
        fetchSystemHealth(),
        fetchDatabaseHealth(),
        fetchApiMetrics(),
        fetchRealtimeMetrics(),
      ]);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAllData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "good":
      case "operational":
        return "text-green-600 bg-green-50";
      case "warning":
      case "degraded":
        return "text-yellow-600 bg-yellow-50";
      case "critical":
      case "error":
      case "down":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "good":
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "critical":
      case "error":
      case "down":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading system health metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            System Health Monitoring
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time system performance and health metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  System Status
                </p>
                <p className="text-2xl font-bold mt-2">
                  {systemHealth?.status || "Unknown"}
                </p>
              </div>
              {getStatusIcon(systemHealth?.status)}
            </div>
            <Badge
              className={`mt-3 ${getStatusColor(systemHealth?.status)}`}
              variant="secondary"
            >
              {systemHealth?.status || "Unknown"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Database Status
                </p>
                <p className="text-2xl font-bold mt-2">
                  {databaseHealth?.status || "Unknown"}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <Badge
              className={`mt-3 ${getStatusColor(databaseHealth?.status)}`}
              variant="secondary"
            >
              {databaseHealth?.status || "Unknown"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  API Response Time
                </p>
                <p className="text-2xl font-bold mt-2">
                  {apiMetrics?.averageResponseTime
                    ? `${apiMetrics.averageResponseTime}ms`
                    : "N/A"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {apiMetrics?.totalRequests || 0} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold mt-2">
                  {apiMetrics?.errorRate
                    ? `${apiMetrics.errorRate.toFixed(2)}%`
                    : "0%"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {apiMetrics?.errorCount || 0} errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Cpu className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-medium">CPU Usage</span>
                </div>
                <span className="text-lg font-bold">
                  {realtimeMetrics?.cpuUsage
                    ? `${realtimeMetrics.cpuUsage.toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <HardDrive className="h-5 w-5 text-green-600 mr-3" />
                  <span className="font-medium">Memory Usage</span>
                </div>
                <span className="text-lg font-bold">
                  {realtimeMetrics?.memoryUsage
                    ? `${realtimeMetrics.memoryUsage.toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="font-medium">Active Connections</span>
                </div>
                <span className="text-lg font-bold">
                  {realtimeMetrics?.activeConnections || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-600 mr-3" />
                  <span className="font-medium">Uptime</span>
                </div>
                <span className="text-lg font-bold">
                  {systemHealth?.uptime || "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Query Performance</span>
                <span className="text-lg font-bold">
                  {databaseHealth?.averageQueryTime
                    ? `${databaseHealth.averageQueryTime}ms`
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Total Queries</span>
                <span className="text-lg font-bold">
                  {databaseHealth?.totalQueries || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Slow Queries</span>
                <span className="text-lg font-bold">
                  {databaseHealth?.slowQueries || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Connection Pool</span>
                <span className="text-lg font-bold">
                  {databaseHealth?.connectionPoolUsage
                    ? `${databaseHealth.connectionPoolUsage}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            API Response Time Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiMetrics?.endpointMetrics &&
            apiMetrics.endpointMetrics.length > 0 ? (
              apiMetrics.endpointMetrics.map((endpoint, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {endpoint.endpoint}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {endpoint.method} • {endpoint.requestCount} requests
                    </p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Avg Response</p>
                      <p className="text-lg font-bold">
                        {endpoint.averageResponseTime}ms
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className="text-lg font-bold">
                        {endpoint.errorRate.toFixed(2)}%
                      </p>
                    </div>
                    <Badge
                      className={getStatusColor(endpoint.status)}
                      variant="secondary"
                    >
                      {endpoint.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No endpoint metrics available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthPage;

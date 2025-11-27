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
  FileText,
  Search,
  Download,
  Calendar,
  User,
  Activity,
  RefreshCw,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    adminId: "",
    action: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    lastEvaluatedKey: null,
  });
  const [expandedLogs, setExpandedLogs] = useState(new Set());

  // Available action types for filtering
  const actionTypes = [
    "USER_ROLE_CHANGE",
    "USER_DEACTIVATION",
    "USER_REACTIVATION",
    "COURSE_APPROVAL",
    "COURSE_REJECTION",
    "CONTENT_MODERATION",
    "PLATFORM_SETTINGS_UPDATE",
    "FEATURE_FLAGS_UPDATE",
    "SECURITY_POLICIES_UPDATE",
    "ADMIN_ACCESS_VERIFIED",
  ];

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async (resetPagination = true) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.adminId) params.append("adminId", filters.adminId);
      if (filters.action) params.append("action", filters.action);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("limit", pagination.limit.toString());

      if (!resetPagination && pagination.lastEvaluatedKey) {
        params.append("lastEvaluatedKey", pagination.lastEvaluatedKey);
      }

      // Fetch audit reports
      const response = await fetch(`/api/admin/audit/reports?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audit data");
      }

      const data = await response.json();

      if (resetPagination) {
        setAuditLogs(data.data.auditTrail || []);
      } else {
        setAuditLogs((prev) => [...prev, ...(data.data.auditTrail || [])]);
      }

      setAuditStats(data.data.statistics);
      setPagination((prev) => ({
        ...prev,
        lastEvaluatedKey: data.data.pagination?.lastEvaluatedKey || null,
      }));
    } catch (err) {
      console.error("Error fetching audit data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, lastEvaluatedKey: null }));
    fetchAuditData(true);
  };

  const clearFilters = () => {
    setFilters({
      adminId: "",
      action: "",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPagination((prev) => ({ ...prev, lastEvaluatedKey: null }));
    fetchAuditData(true);
  };

  const loadMore = () => {
    if (pagination.lastEvaluatedKey) {
      fetchAuditData(false);
    }
  };

  const toggleLogExpansion = (logId) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const exportAuditData = async (format = "csv") => {
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      params.append("dataType", "audit");
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/admin/analytics/export?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export audit data");
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `audit-trail-${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting audit data:", err);
      setError("Failed to export audit data");
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case "USER_ROLE_CHANGE":
      case "USER_DEACTIVATION":
      case "USER_REACTIVATION":
        return "default";
      case "COURSE_APPROVAL":
      case "COURSE_REJECTION":
        return "secondary";
      case "CONTENT_MODERATION":
        return "outline";
      case "PLATFORM_SETTINGS_UPDATE":
      case "FEATURE_FLAGS_UPDATE":
      case "SECURITY_POLICIES_UPDATE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!filters.search) return true;

    const searchLower = filters.search.toLowerCase();
    return (
      log.adminId?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.details?.targetEntity?.toLowerCase().includes(searchLower) ||
      log.details?.reason?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && auditLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading audit data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">
            Comprehensive audit log display with search and filtering
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportAuditData("csv")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => exportAuditData("json")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={() => fetchAuditData(true)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Actions
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {auditStats.totalActions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Admins
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(auditStats.actionsByAdmin || {}).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Action Types
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(auditStats.actionsByType || {}).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Actions
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {auditStats.actionsByDate?.[
                  new Date().toISOString().split("T")[0]
                ] || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Input
              placeholder="Admin ID"
              value={filters.adminId}
              onChange={(e) => handleFilterChange("adminId", e.target.value)}
            />

            <Select
              value={filters.action}
              onValueChange={(value) => handleFilterChange("action", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="datetime-local"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />

            <Input
              type="datetime-local"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />

            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Apply
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Action History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No audit logs found for the selected criteria.
                  </p>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.actionId}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={getActionBadgeColor(log.action)}>
                              {log.action}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              by {log.adminId}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {log.details?.targetEntity && (
                              <p className="text-sm">
                                <span className="font-medium">Target:</span>{" "}
                                {log.details.targetEntity}
                              </p>
                            )}

                            {log.details?.reason && (
                              <p className="text-sm">
                                <span className="font-medium">Reason:</span>{" "}
                                {log.details.reason}
                              </p>
                            )}

                            {expandedLogs.has(log.actionId) && (
                              <div className="mt-3 p-3 bg-muted rounded text-sm">
                                <div className="font-medium mb-2">
                                  Full Details:
                                </div>
                                <pre className="whitespace-pre-wrap text-xs">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                                {log.ipAddress && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    IP: {log.ipAddress}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLogExpansion(log.actionId)}
                        >
                          {expandedLogs.has(log.actionId) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {pagination.lastEvaluatedKey && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={loadMore}
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {auditStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Actions by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(auditStats.actionsByType || {}).map(
                      ([action, count]) => (
                        <div
                          key={action}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm">{action}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions by Admin */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions by Admin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(auditStats.actionsByAdmin || {}).map(
                      ([adminId, count]) => (
                        <div
                          key={adminId}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm">{adminId}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions by Date */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Actions by Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(auditStats.actionsByDate || {})
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 12)
                      .map(([date, count]) => (
                        <div
                          key={date}
                          className="flex justify-between items-center p-2 bg-muted rounded"
                        >
                          <span className="text-sm">{date}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

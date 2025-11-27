"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Download,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import UserGrowthChart from "./components/UserGrowthChart";
import RevenueAnalyticsChart from "./components/RevenueAnalyticsChart";
import CoursePerformanceChart from "./components/CoursePerformanceChart";
import EngagementMetricsChart from "./components/EngagementMetricsChart";
import ReportingPanel from "./components/ReportingPanel";
import { toast } from "react-hot-toast";

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Date range options
  const dateRangeOptions = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "1y", label: "Last year" },
    { value: "custom", label: "Custom range" },
  ];

  // Calculate date range for API calls
  const getDateRangeParams = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRangeParams();

      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/analytics?startDate=${startDate}&endDate=${endDate}&groupBy=day`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const result = await response.json();
      setAnalyticsData(result.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Export analytics data
  const handleExport = async (format, dataType) => {
    try {
      setExportLoading(true);
      const { startDate, endDate } = getDateRangeParams();

      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/analytics/export?format=${format}&dataType=${dataType}&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `analytics-${dataType}-${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Analytics data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export analytics data");
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive platform analytics and insights
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button
            variant="outline"
            onClick={() => handleExport("csv", "platform")}
            disabled={exportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.platformMetrics?.totalUsers?.toLocaleString() ||
                "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +
                {analyticsData?.platformMetrics?.percentageChanges?.users ||
                  "0"}
                %
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.platformMetrics?.totalCourses?.toLocaleString() ||
                "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +
                {analyticsData?.platformMetrics?.percentageChanges?.courses ||
                  "0"}
                %
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.platformMetrics?.totalEnrollments?.toLocaleString() ||
                "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +
                {analyticsData?.platformMetrics?.percentageChanges
                  ?.enrollments || "0"}
                %
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData?.revenue?.totalRevenue?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +{analyticsData?.revenue?.growthRate || "0"}%
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserGrowthChart data={analyticsData?.userGrowth} />
            <RevenueAnalyticsChart data={analyticsData?.revenue} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CoursePerformanceChart data={analyticsData?.platformMetrics} />
            <EngagementMetricsChart data={analyticsData?.userGrowth} />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserGrowthChart data={analyticsData?.userGrowth} />
            <EngagementMetricsChart data={analyticsData?.userGrowth} />
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CoursePerformanceChart data={analyticsData?.platformMetrics} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Course Categories Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  Course category analytics will be displayed here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueAnalyticsChart data={analyticsData?.revenue} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Revenue by Course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  Revenue breakdown by course will be displayed here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;

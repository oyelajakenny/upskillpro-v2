"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  FileText,
  Calendar,
  Clock,
  Mail,
  Settings,
  Filter,
  BarChart3,
} from "lucide-react";
import { toast } from "react-hot-toast";

const ReportingPanel = () => {
  const [reportConfig, setReportConfig] = useState({
    reportType: "platform",
    format: "csv",
    dateRange: "30d",
    customStartDate: "",
    customEndDate: "",
    includeCharts: false,
    emailDelivery: false,
    recipientEmail: "",
    scheduledReporting: false,
    scheduleFrequency: "weekly",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([
    {
      id: 1,
      name: "Weekly Platform Analytics",
      type: "platform",
      frequency: "weekly",
      format: "pdf",
      nextRun: "2025-01-22T09:00:00Z",
      recipients: ["admin@upskillpro.com"],
      active: true,
    },
    {
      id: 2,
      name: "Monthly Revenue Report",
      type: "revenue",
      frequency: "monthly",
      format: "csv",
      nextRun: "2025-02-01T09:00:00Z",
      recipients: ["finance@upskillpro.com", "admin@upskillpro.com"],
      active: true,
    },
  ]);

  // Report type options
  const reportTypes = [
    {
      value: "platform",
      label: "Platform Overview",
      description: "Complete platform metrics and analytics",
    },
    {
      value: "users",
      label: "User Analytics",
      description: "User growth, engagement, and activity data",
    },
    {
      value: "courses",
      label: "Course Performance",
      description: "Course statistics and performance metrics",
    },
    {
      value: "revenue",
      label: "Revenue Analytics",
      description: "Financial data and revenue insights",
    },
    {
      value: "audit",
      label: "Audit Trail",
      description: "Administrative actions and system logs",
    },
    {
      value: "custom",
      label: "Custom Report",
      description: "Build a custom report with selected metrics",
    },
  ];

  // Format options
  const formatOptions = [
    {
      value: "csv",
      label: "CSV",
      description: "Comma-separated values for spreadsheet analysis",
    },
    {
      value: "pdf",
      label: "PDF",
      description: "Formatted document with charts and visualizations",
    },
    {
      value: "json",
      label: "JSON",
      description: "Raw data in JSON format for API integration",
    },
    {
      value: "excel",
      label: "Excel",
      description: "Microsoft Excel workbook with multiple sheets",
    },
  ];

  // Date range options
  const dateRangeOptions = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "1y", label: "Last year" },
    { value: "custom", label: "Custom range" },
  ];

  // Schedule frequency options
  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
  ];

  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);

      // Prepare date parameters
      let startDate, endDate;
      if (reportConfig.dateRange === "custom") {
        startDate = reportConfig.customStartDate;
        endDate = reportConfig.customEndDate;
      } else {
        const end = new Date();
        const start = new Date();

        switch (reportConfig.dateRange) {
          case "7d":
            start.setDate(end.getDate() - 7);
            break;
          case "30d":
            start.setDate(end.getDate() - 30);
            break;
          case "90d":
            start.setDate(end.getDate() - 90);
            break;
          case "1y":
            start.setFullYear(end.getFullYear() - 1);
            break;
        }

        startDate = start.toISOString().split("T")[0];
        endDate = end.toISOString().split("T")[0];
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/analytics/export?format=${reportConfig.format}&dataType=${reportConfig.reportType}&startDate=${startDate}&endDate=${endDate}&includeCharts=${reportConfig.includeCharts}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${reportConfig.reportType}-report-${
        new Date().toISOString().split("T")[0]
      }.${reportConfig.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Handle email delivery if enabled
      if (reportConfig.emailDelivery && reportConfig.recipientEmail) {
        await handleEmailDelivery(startDate, endDate);
      }

      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle email delivery
  const handleEmailDelivery = async (startDate, endDate) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/reports/email", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: reportConfig.reportType,
          format: reportConfig.format,
          startDate,
          endDate,
          recipientEmail: reportConfig.recipientEmail,
          includeCharts: reportConfig.includeCharts,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast.success("Report sent via email successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send report via email");
    }
  };

  // Handle scheduled report creation
  const handleCreateScheduledReport = async () => {
    try {
      const newReport = {
        name: `${
          reportConfig.reportType.charAt(0).toUpperCase() +
          reportConfig.reportType.slice(1)
        } Report`,
        type: reportConfig.reportType,
        frequency: reportConfig.scheduleFrequency,
        format: reportConfig.format,
        recipients: [reportConfig.recipientEmail],
        dateRange: reportConfig.dateRange,
        includeCharts: reportConfig.includeCharts,
      };

      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/reports/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newReport),
      });

      if (!response.ok) {
        throw new Error("Failed to create scheduled report");
      }

      const result = await response.json();

      // Add to local state (in real app, this would refetch from server)
      setScheduledReports((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...newReport,
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
        },
      ]);

      toast.success("Scheduled report created successfully");
    } catch (error) {
      console.error("Error creating scheduled report:", error);
      toast.error("Failed to create scheduled report");
    }
  };

  // Toggle scheduled report status
  const toggleScheduledReport = async (reportId) => {
    try {
      const report = scheduledReports.find((r) => r.id === reportId);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/admin/reports/schedule/${reportId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !report.active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update scheduled report");
      }

      setScheduledReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, active: !r.active } : r))
      );

      toast.success(
        `Scheduled report ${report.active ? "disabled" : "enabled"}`
      );
    } catch (error) {
      console.error("Error updating scheduled report:", error);
      toast.error("Failed to update scheduled report");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Advanced Reporting & Data Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Report Configuration</h3>

                {/* Report Type */}
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportConfig.reportType}
                    onValueChange={(value) =>
                      setReportConfig((prev) => ({
                        ...prev,
                        reportType: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">
                              {type.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <Label htmlFor="format">Export Format</Label>
                  <Select
                    value={reportConfig.format}
                    onValueChange={(value) =>
                      setReportConfig((prev) => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          <div>
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">
                              {format.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select
                    value={reportConfig.dateRange}
                    onValueChange={(value) =>
                      setReportConfig((prev) => ({ ...prev, dateRange: value }))
                    }
                  >
                    <SelectTrigger>
                      <Calendar className="h-4 w-4 mr-2" />
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
                </div>

                {/* Custom Date Range */}
                {reportConfig.dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={reportConfig.customStartDate}
                        onChange={(e) =>
                          setReportConfig((prev) => ({
                            ...prev,
                            customStartDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={reportConfig.customEndDate}
                        onChange={(e) =>
                          setReportConfig((prev) => ({
                            ...prev,
                            customEndDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Advanced Options</h3>

                {/* Include Charts */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={reportConfig.includeCharts}
                    onCheckedChange={(checked) =>
                      setReportConfig((prev) => ({
                        ...prev,
                        includeCharts: checked,
                      }))
                    }
                  />
                  <Label htmlFor="includeCharts" className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Include Charts and Visualizations
                  </Label>
                </div>

                {/* Email Delivery */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailDelivery"
                      checked={reportConfig.emailDelivery}
                      onCheckedChange={(checked) =>
                        setReportConfig((prev) => ({
                          ...prev,
                          emailDelivery: checked,
                        }))
                      }
                    />
                    <Label
                      htmlFor="emailDelivery"
                      className="flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Delivery
                    </Label>
                  </div>

                  {reportConfig.emailDelivery && (
                    <Input
                      placeholder="recipient@example.com"
                      value={reportConfig.recipientEmail}
                      onChange={(e) =>
                        setReportConfig((prev) => ({
                          ...prev,
                          recipientEmail: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                {/* Scheduled Reporting */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scheduledReporting"
                      checked={reportConfig.scheduledReporting}
                      onCheckedChange={(checked) =>
                        setReportConfig((prev) => ({
                          ...prev,
                          scheduledReporting: checked,
                        }))
                      }
                    />
                    <Label
                      htmlFor="scheduledReporting"
                      className="flex items-center"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Create Scheduled Report
                    </Label>
                  </div>

                  {reportConfig.scheduledReporting && (
                    <Select
                      value={reportConfig.scheduleFrequency}
                      onValueChange={(value) =>
                        setReportConfig((prev) => ({
                          ...prev,
                          scheduleFrequency: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <Button
                    onClick={
                      reportConfig.scheduledReporting
                        ? handleCreateScheduledReport
                        : handleGenerateReport
                    }
                    disabled={isGenerating}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGenerating
                      ? "Generating..."
                      : reportConfig.scheduledReporting
                      ? "Create Scheduled Report"
                      : "Generate & Download Report"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Scheduled Reports</h3>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Settings
              </Button>
            </div>

            <div className="space-y-4">
              {scheduledReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 border rounded-lg bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {report.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {report.frequency}
                        </span>
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {report.format.toUpperCase()}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Next: {new Date(report.nextRun).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Recipients: {report.recipients.join(", ")}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={report.active ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleScheduledReport(report.id)}
                      >
                        {report.active ? "Active" : "Inactive"}
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportingPanel;

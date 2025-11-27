"use client";

import { useState } from "react";
import { useWebSocketContext } from "@/lib/websocket/WebSocketProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  X,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * Security alerts panel component
 * Displays real-time security alerts with priority levels
 */
export default function SecurityAlertsPanel({ isOpen, onClose }) {
  const { securityAlerts, unreadSecurityAlerts, clearSecurityAlert } =
    useWebSocketContext();

  const [filter, setFilter] = useState("all"); // all, critical, high, medium, low

  const getAlertIcon = (priority) => {
    switch (priority) {
      case "critical":
        return AlertOctagon;
      case "high":
        return AlertTriangle;
      case "medium":
        return Info;
      case "low":
      default:
        return CheckCircle;
    }
  };

  const getAlertColor = (priority) => {
    switch (priority) {
      case "critical":
        return "text-red-700 bg-red-100 border-red-300";
      case "high":
        return "text-orange-700 bg-orange-100 border-orange-300";
      case "medium":
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
      case "low":
      default:
        return "text-blue-700 bg-blue-100 border-blue-300";
    }
  };

  const getBadgeColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
      default:
        return "bg-blue-600 text-white";
    }
  };

  const filteredAlerts = securityAlerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.priority === filter;
  });

  const priorityCounts = {
    critical: securityAlerts.filter((a) => a.priority === "critical").length,
    high: securityAlerts.filter((a) => a.priority === "high").length,
    medium: securityAlerts.filter((a) => a.priority === "medium").length,
    low: securityAlerts.filter((a) => a.priority === "low").length,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-red-50">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Security Alerts
              </h2>
              {unreadSecurityAlerts > 0 && (
                <Badge className="bg-red-600 text-white">
                  {unreadSecurityAlerts}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2 p-4 border-b">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({securityAlerts.length})
            </Button>
            <Button
              variant={filter === "critical" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("critical")}
              className={
                filter === "critical" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              Critical ({priorityCounts.critical})
            </Button>
            <Button
              variant={filter === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("high")}
              className={
                filter === "high" ? "bg-orange-600 hover:bg-orange-700" : ""
              }
            >
              High ({priorityCounts.high})
            </Button>
            <Button
              variant={filter === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("medium")}
              className={
                filter === "medium" ? "bg-yellow-600 hover:bg-yellow-700" : ""
              }
            >
              Medium ({priorityCounts.medium})
            </Button>
            <Button
              variant={filter === "low" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("low")}
            >
              Low ({priorityCounts.low})
            </Button>
          </div>

          {/* Alerts list */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Shield className="h-12 w-12 mb-2 text-gray-400" />
                <p className="text-sm">No security alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => {
                  const Icon = getAlertIcon(alert.priority);
                  const colorClass = getAlertColor(alert.priority);
                  const badgeColor = getBadgeColor(alert.priority);

                  return (
                    <Card key={alert.id} className={`border-2 ${colorClass}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge className={badgeColor}>
                                    {alert.priority?.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline">
                                    {alert.category}
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {alert.title}
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                  {alert.description}
                                </p>
                                {alert.details && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                    <p>
                                      <strong>IP:</strong> {alert.details.ip}
                                    </p>
                                    {alert.details.user && (
                                      <p>
                                        <strong>User:</strong>{" "}
                                        {alert.details.user}
                                      </p>
                                    )}
                                    {alert.details.action && (
                                      <p>
                                        <strong>Action:</strong>{" "}
                                        {alert.details.action}
                                      </p>
                                    )}
                                  </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  {alert.timestamp
                                    ? formatDistanceToNow(
                                        new Date(alert.timestamp),
                                        {
                                          addSuffix: true,
                                        }
                                      )
                                    : "Just now"}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => clearSecurityAlert(alert.id)}
                                className="ml-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {alert.priority === "critical" && (
                              <div className="mt-3 flex space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Investigate
                                </Button>
                                <Button size="sm" variant="outline">
                                  Acknowledge
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

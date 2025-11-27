"use client";

import { useEffect, useState } from "react";
import { useWebSocketContext } from "@/lib/websocket/WebSocketProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";

/**
 * Real-time metrics component for admin dashboard
 * Displays live platform statistics with WebSocket updates
 */
export default function RealTimeMetrics() {
  const { isConnected, metrics } = useWebSocketContext();
  const [displayMetrics, setDisplayMetrics] = useState({
    totalUsers: 0,
    activeCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    userGrowth: 0,
    courseGrowth: 0,
    enrollmentGrowth: 0,
    revenueGrowth: 0,
  });

  // Update display metrics when WebSocket data arrives
  useEffect(() => {
    if (metrics) {
      setDisplayMetrics({
        totalUsers: metrics.totalUsers || 0,
        activeCourses: metrics.activeCourses || 0,
        totalEnrollments: metrics.totalEnrollments || 0,
        totalRevenue: metrics.totalRevenue || 0,
        userGrowth: metrics.userGrowth || 0,
        courseGrowth: metrics.courseGrowth || 0,
        enrollmentGrowth: metrics.enrollmentGrowth || 0,
        revenueGrowth: metrics.revenueGrowth || 0,
      });
    }
  }, [metrics]);

  const metricCards = [
    {
      title: "Total Users",
      value: displayMetrics.totalUsers.toLocaleString(),
      growth: displayMetrics.userGrowth,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Courses",
      value: displayMetrics.activeCourses.toLocaleString(),
      growth: displayMetrics.courseGrowth,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Enrollments",
      value: displayMetrics.totalEnrollments.toLocaleString(),
      growth: displayMetrics.enrollmentGrowth,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: `$${displayMetrics.totalRevenue.toLocaleString()}`,
      growth: displayMetrics.revenueGrowth,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Platform Metrics</h2>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                Live
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-gray-400" />
              <Badge
                variant="outline"
                className="text-gray-400 border-gray-400"
              >
                Offline
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.growth >= 0;

          return (
            <Card
              key={metric.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </div>
                <div className="flex items-center mt-2">
                  <span
                    className={`text-sm font-medium ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {metric.growth.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    vs last period
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

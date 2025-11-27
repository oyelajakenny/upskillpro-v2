"use client";

import { useWebSocketContext } from "@/lib/websocket/WebSocketProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, BookOpen, ShoppingCart, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * Real-time activity feed component
 * Displays live platform activities with WebSocket updates
 */
export default function RealTimeActivityFeed() {
  const { activities } = useWebSocketContext();

  const getActivityIcon = (type) => {
    switch (type) {
      case "user_registration":
        return UserPlus;
      case "course_creation":
        return BookOpen;
      case "enrollment":
        return ShoppingCart;
      default:
        return AlertCircle;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "user_registration":
        return "text-blue-600 bg-blue-50";
      case "course_creation":
        return "text-green-600 bg-green-50";
      case "enrollment":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getActivityBadgeColor = (type) => {
    switch (type) {
      case "user_registration":
        return "bg-blue-100 text-blue-800";
      case "course_creation":
        return "bg-green-100 text-green-800";
      case "enrollment":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto pr-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="h-12 w-12 mb-2 text-gray-400" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                const badgeColor = getActivityBadgeColor(activity.type);

                return (
                  <div
                    key={activity.id || index}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <Badge className={`ml-2 ${badgeColor}`}>
                          {activity.type?.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.timestamp
                          ? formatDistanceToNow(new Date(activity.timestamp), {
                              addSuffix: true,
                            })
                          : "Just now"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

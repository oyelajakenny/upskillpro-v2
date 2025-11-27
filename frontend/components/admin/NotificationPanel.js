"use client";

import { useState } from "react";
import { useWebSocketContext } from "@/lib/websocket/WebSocketProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * Notification panel component for admin dashboard
 * Displays real-time notifications with management capabilities
 */
export default function NotificationPanel({ isOpen, onClose }) {
  const {
    notifications,
    unreadNotifications,
    clearNotification,
    clearAllNotifications,
    markNotificationAsRead,
  } = useWebSocketContext();

  const [filter, setFilter] = useState("all"); // all, unread, read

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "error":
        return AlertCircle;
      case "info":
      default:
        return Info;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "error":
        return "text-red-600 bg-red-50";
      case "info":
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read;
    if (filter === "read") return notification.read;
    return true;
  });

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
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
              {unreadNotifications > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadNotifications}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center space-x-2 p-4 border-b">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadNotifications})
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("read")}
            >
              Read ({notifications.length - unreadNotifications})
            </Button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-end p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Bell className="h-12 w-12 mb-2 text-gray-400" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);

                  return (
                    <Card
                      key={notification.id}
                      className={`${
                        !notification.read ? "border-l-4 border-l-blue-500" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {notification.timestamp
                                    ? formatDistanceToNow(
                                        new Date(notification.timestamp),
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
                                onClick={() =>
                                  clearNotification(notification.id)
                                }
                                className="ml-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {!notification.read && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() =>
                                  markNotificationAsRead(notification.id)
                                }
                                className="mt-2 p-0 h-auto text-blue-600"
                              >
                                Mark as read
                              </Button>
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

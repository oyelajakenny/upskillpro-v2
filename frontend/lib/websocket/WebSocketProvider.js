"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import Cookies from "js-cookie";

const WebSocketContext = createContext(null);

/**
 * WebSocket Provider for admin dashboard
 * Manages WebSocket connection and provides real-time data to child components
 */
export function WebSocketProvider({ children }) {
  const [token, setToken] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // Get token from cookies
  useEffect(() => {
    const authToken = Cookies.get("token");
    if (authToken) {
      setToken(authToken);
    }
  }, []);

  // Handle metrics updates
  const handleMetricsUpdate = (data) => {
    setMetrics(data.data);
  };

  // Handle activity updates
  const handleActivityUpdate = (data) => {
    setActivities((prev) => [data.data, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  // Handle notifications
  const handleNotification = (data) => {
    setNotifications((prev) => [data.data, ...prev]);
  };

  // Handle security alerts
  const handleSecurityAlert = (data) => {
    setSecurityAlerts((prev) => [data.data, ...prev]);
  };

  // Handle system health updates
  const handleSystemHealth = (data) => {
    setSystemHealth(data.data);
  };

  // Initialize WebSocket connection
  const websocket = useWebSocket(token, {
    autoConnect: true,
    channels: ["metrics", "activity", "notifications", "security"],
    onMetricsUpdate: handleMetricsUpdate,
    onActivityUpdate: handleActivityUpdate,
    onNotification: handleNotification,
    onSecurityAlert: handleSecurityAlert,
    onSystemHealth: handleSystemHealth,
  });

  // Clear notification
  const clearNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Clear security alert
  const clearSecurityAlert = (alertId) => {
    setSecurityAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const value = {
    // Connection state
    isConnected: websocket.isConnected,
    connectionError: websocket.connectionError,
    subscriptions: websocket.subscriptions,

    // Real-time data
    metrics,
    activities,
    notifications,
    securityAlerts,
    systemHealth,

    // Unread counts
    unreadNotifications: notifications.filter((n) => !n.read).length,
    unreadSecurityAlerts: securityAlerts.filter((a) => !a.acknowledged).length,

    // Methods
    connect: websocket.connect,
    disconnect: websocket.disconnect,
    subscribe: websocket.subscribe,
    unsubscribe: websocket.unsubscribe,
    ping: websocket.ping,
    clearNotification,
    clearAllNotifications,
    clearSecurityAlert,
    markNotificationAsRead,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket context
 * @returns {Object} WebSocket context value
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider"
    );
  }
  return context;
}

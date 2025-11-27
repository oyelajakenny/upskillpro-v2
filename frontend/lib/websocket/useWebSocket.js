"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import socketClient from "./socketClient";

/**
 * Custom hook for WebSocket connection and real-time updates
 * @param {string} token - JWT authentication token
 * @param {Object} options - Configuration options
 * @returns {Object} WebSocket state and methods
 */
export function useWebSocket(token, options = {}) {
  const {
    autoConnect = true,
    channels = [],
    onMetricsUpdate = null,
    onActivityUpdate = null,
    onNotification = null,
    onSecurityAlert = null,
    onSystemHealth = null,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [subscriptions, setSubscriptions] = useState(new Set());
  const listenersRegistered = useRef(false);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (token) {
      socketClient.connect(token);
    }
  }, [token]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    socketClient.disconnect();
    setIsConnected(false);
    setSubscriptions(new Set());
  }, []);

  // Subscribe to a channel
  const subscribe = useCallback((channel) => {
    socketClient.subscribe(channel);
    setSubscriptions((prev) => new Set([...prev, channel]));
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel) => {
    socketClient.unsubscribe(channel);
    setSubscriptions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(channel);
      return newSet;
    });
  }, []);

  // Send ping
  const ping = useCallback(() => {
    socketClient.ping();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (listenersRegistered.current) return;

    // Connection status listener
    const handleConnectionStatus = (data) => {
      setIsConnected(data.connected);
      if (!data.connected) {
        setConnectionError(data.reason || "Disconnected");
      } else {
        setConnectionError(null);
      }
    };

    // Connection error listener
    const handleConnectionError = (data) => {
      setConnectionError(data.error);
    };

    // Metrics update listener
    const handleMetricsUpdate = (data) => {
      if (onMetricsUpdate) {
        onMetricsUpdate(data);
      }
    };

    // Activity update listener
    const handleActivityUpdate = (data) => {
      if (onActivityUpdate) {
        onActivityUpdate(data);
      }
    };

    // Notification listener
    const handleNotification = (data) => {
      if (onNotification) {
        onNotification(data);
      }
    };

    // Security alert listener
    const handleSecurityAlert = (data) => {
      if (onSecurityAlert) {
        onSecurityAlert(data);
      }
    };

    // System health listener
    const handleSystemHealth = (data) => {
      if (onSystemHealth) {
        onSystemHealth(data);
      }
    };

    // Register listeners
    socketClient.on("connection:status", handleConnectionStatus);
    socketClient.on("connection:error", handleConnectionError);
    socketClient.on("metrics:update", handleMetricsUpdate);
    socketClient.on("activity:update", handleActivityUpdate);
    socketClient.on("notification:received", handleNotification);
    socketClient.on("security:alert", handleSecurityAlert);
    socketClient.on("system:health", handleSystemHealth);

    listenersRegistered.current = true;

    // Cleanup listeners on unmount
    return () => {
      socketClient.off("connection:status", handleConnectionStatus);
      socketClient.off("connection:error", handleConnectionError);
      socketClient.off("metrics:update", handleMetricsUpdate);
      socketClient.off("activity:update", handleActivityUpdate);
      socketClient.off("notification:received", handleNotification);
      socketClient.off("security:alert", handleSecurityAlert);
      socketClient.off("system:health", handleSystemHealth);
      listenersRegistered.current = false;
    };
  }, [
    onMetricsUpdate,
    onActivityUpdate,
    onNotification,
    onSecurityAlert,
    onSystemHealth,
  ]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, token, connect, disconnect]);

  // Auto-subscribe to channels
  useEffect(() => {
    if (isConnected && channels.length > 0) {
      channels.forEach((channel) => {
        if (!subscriptions.has(channel)) {
          subscribe(channel);
        }
      });
    }
  }, [isConnected, channels, subscriptions, subscribe]);

  // Health check ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      ping();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, ping]);

  return {
    isConnected,
    connectionError,
    subscriptions: Array.from(subscriptions),
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ping,
  };
}

/**
 * Hook for dashboard metrics updates
 * @param {string} token - JWT authentication token
 * @param {Function} onUpdate - Callback for metrics updates
 * @returns {Object} WebSocket state
 */
export function useDashboardMetrics(token, onUpdate) {
  return useWebSocket(token, {
    channels: ["metrics"],
    onMetricsUpdate: onUpdate,
  });
}

/**
 * Hook for activity feed updates
 * @param {string} token - JWT authentication token
 * @param {Function} onUpdate - Callback for activity updates
 * @returns {Object} WebSocket state
 */
export function useActivityFeed(token, onUpdate) {
  return useWebSocket(token, {
    channels: ["activity"],
    onActivityUpdate: onUpdate,
  });
}

/**
 * Hook for admin notifications
 * @param {string} token - JWT authentication token
 * @param {Function} onNotification - Callback for notifications
 * @returns {Object} WebSocket state
 */
export function useAdminNotifications(token, onNotification) {
  return useWebSocket(token, {
    channels: ["notifications"],
    onNotification,
  });
}

/**
 * Hook for security alerts
 * @param {string} token - JWT authentication token
 * @param {Function} onAlert - Callback for security alerts
 * @returns {Object} WebSocket state
 */
export function useSecurityAlerts(token, onAlert) {
  return useWebSocket(token, {
    channels: ["security"],
    onSecurityAlert: onAlert,
  });
}

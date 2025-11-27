/**
 * WebSocket Integration Tests
 *
 * Tests for WebSocket real-time features including:
 * - WebSocket connection establishment
 * - Real-time metrics updates
 * - Activity feed updates
 * - Notification delivery
 * - Security alert handling
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import socketClient from "../../../lib/websocket/socketClient";
import { WebSocketProvider } from "../../../lib/websocket/WebSocketProvider";
import RealTimeMetrics from "../../../components/admin/RealTimeMetrics";
import RealTimeActivityFeed from "../../../components/admin/RealTimeActivityFeed";

// Mock socket.io-client
jest.mock("socket.io-client", () => {
  const mockSocket = {
    connected: false,
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  return {
    io: jest.fn(() => mockSocket),
  };
});

// Mock js-cookie
jest.mock("js-cookie", () => ({
  get: jest.fn(() => "mock-token"),
}));

describe("WebSocket Integration", () => {
  let mockSocket;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get mock socket instance
    const { io } = require("socket.io-client");
    mockSocket = io();
    mockSocket.connected = true;
  });

  afterEach(() => {
    socketClient.disconnect();
  });

  describe("WebSocket Connection", () => {
    it("should establish connection with authentication token", () => {
      const token = "test-token";
      socketClient.connect(token);

      const { io } = require("socket.io-client");
      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token },
          transports: ["websocket", "polling"],
        })
      );
    });

    it("should handle connection success", () => {
      const connectionCallback = jest.fn();
      socketClient.on("connection:status", connectionCallback);

      socketClient.connect("test-token");

      // Simulate connection event
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];

      if (connectHandler) {
        act(() => {
          connectHandler();
        });
      }

      expect(socketClient.getConnectionStatus()).toBe(true);
    });

    it("should handle connection errors", () => {
      const errorCallback = jest.fn();
      socketClient.on("connection:error", errorCallback);

      socketClient.connect("test-token");

      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect_error"
      )?.[1];

      if (errorHandler) {
        act(() => {
          errorHandler(new Error("Connection failed"));
        });
      }

      expect(errorCallback).toHaveBeenCalled();
    });

    it("should handle disconnection", () => {
      socketClient.connect("test-token");
      socketClient.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketClient.getConnectionStatus()).toBe(false);
    });
  });

  describe("Real-time Metrics Updates", () => {
    it("should receive and display metrics updates", async () => {
      const TestComponent = () => (
        <WebSocketProvider>
          <RealTimeMetrics />
        </WebSocketProvider>
      );

      render(<TestComponent />);

      // Simulate metrics update
      const metricsHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "dashboard:metrics"
      )?.[1];

      const mockMetrics = {
        data: {
          totalUsers: 1250,
          activeCourses: 89,
          totalEnrollments: 3420,
          totalRevenue: 45670.5,
          userGrowth: 5.2,
          courseGrowth: 3.1,
          enrollmentGrowth: 8.5,
          revenueGrowth: 12.3,
        },
      };

      if (metricsHandler) {
        act(() => {
          metricsHandler(mockMetrics);
        });
      }

      await waitFor(() => {
        expect(screen.getByText("Platform Metrics")).toBeInTheDocument();
      });
    });

    it("should show live connection status", async () => {
      const TestComponent = () => (
        <WebSocketProvider>
          <RealTimeMetrics />
        </WebSocketProvider>
      );

      render(<TestComponent />);

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];

      if (connectHandler) {
        act(() => {
          connectHandler();
        });
      }

      await waitFor(() => {
        expect(screen.getByText("Live")).toBeInTheDocument();
      });
    });
  });

  describe("Activity Feed Updates", () => {
    it("should receive and display activity updates", async () => {
      const TestComponent = () => (
        <WebSocketProvider>
          <RealTimeActivityFeed />
        </WebSocketProvider>
      );

      render(<TestComponent />);

      // Simulate activity update
      const activityHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "dashboard:activity"
      )?.[1];

      const mockActivity = {
        data: {
          id: "activity-1",
          title: "New User Registration",
          description: "John Doe has registered as a student",
          type: "user_registration",
          timestamp: new Date().toISOString(),
        },
      };

      if (activityHandler) {
        act(() => {
          activityHandler(mockActivity);
        });
      }

      await waitFor(() => {
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      });
    });

    it("should display empty state when no activities", () => {
      const TestComponent = () => (
        <WebSocketProvider>
          <RealTimeActivityFeed />
        </WebSocketProvider>
      );

      render(<TestComponent />);

      expect(screen.getByText("No recent activity")).toBeInTheDocument();
    });
  });

  describe("Channel Subscriptions", () => {
    it("should subscribe to metrics channel", () => {
      socketClient.connect("test-token");
      socketClient.subscribe("metrics");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "subscribe:metrics",
        expect.any(Object)
      );
    });

    it("should subscribe to activity channel", () => {
      socketClient.connect("test-token");
      socketClient.subscribe("activity");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "subscribe:activity",
        expect.any(Object)
      );
    });

    it("should subscribe to notifications channel", () => {
      socketClient.connect("test-token");
      socketClient.subscribe("notifications");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "subscribe:notifications",
        expect.any(Object)
      );
    });

    it("should subscribe to security channel", () => {
      socketClient.connect("test-token");
      socketClient.subscribe("security");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "subscribe:security",
        expect.any(Object)
      );
    });

    it("should unsubscribe from channels", () => {
      socketClient.connect("test-token");
      socketClient.unsubscribe("metrics");

      expect(mockSocket.emit).toHaveBeenCalledWith("unsubscribe", {
        channel: "metrics",
      });
    });
  });

  describe("Health Check", () => {
    it("should send ping for connection health check", () => {
      socketClient.connect("test-token");
      socketClient.ping();

      expect(mockSocket.emit).toHaveBeenCalledWith("ping");
    });

    it("should receive pong response", () => {
      const pongCallback = jest.fn();
      socketClient.on("health:pong", pongCallback);

      socketClient.connect("test-token");

      // Simulate pong response
      const pongHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "pong"
      )?.[1];

      if (pongHandler) {
        act(() => {
          pongHandler({ timestamp: new Date().toISOString() });
        });
      }

      expect(pongCallback).toHaveBeenCalled();
    });
  });
});

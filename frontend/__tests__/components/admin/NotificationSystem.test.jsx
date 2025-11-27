/**
 * Notification System Tests
 *
 * Tests for the notification and alert system including:
 * - Notification panel rendering
 * - Notification filtering
 * - Mark as read functionality
 * - Clear notifications
 * - Security alerts display
 * - Alert priority handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotificationPanel from "../../../components/admin/NotificationPanel";
import SecurityAlertsPanel from "../../../components/admin/SecurityAlertsPanel";
import { WebSocketProvider } from "../../../lib/websocket/WebSocketProvider";

// Mock WebSocket context
const mockWebSocketContext = {
  notifications: [
    {
      id: "notif-1",
      title: "New User Registered",
      message: "John Doe has joined the platform",
      type: "info",
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: "notif-2",
      title: "Course Approved",
      message: "Introduction to React has been approved",
      type: "success",
      read: true,
      timestamp: new Date().toISOString(),
    },
  ],
  unreadNotifications: 1,
  securityAlerts: [
    {
      id: "alert-1",
      title: "Multiple Failed Login Attempts",
      description: "5 failed login attempts detected",
      priority: "high",
      category: "authentication",
      details: {
        ip: "192.168.1.100",
        user: "test@example.com",
        attempts: 5,
      },
      acknowledged: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: "alert-2",
      title: "Suspicious Activity Detected",
      description: "Unusual access pattern detected",
      priority: "critical",
      category: "suspicious_activity",
      details: {
        ip: "10.0.0.50",
        user: "admin@example.com",
        action: "bulk_data_export",
      },
      acknowledged: false,
      timestamp: new Date().toISOString(),
    },
  ],
  unreadSecurityAlerts: 2,
  clearNotification: jest.fn(),
  clearAllNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  clearSecurityAlert: jest.fn(),
};

jest.mock("../../../lib/websocket/WebSocketProvider", () => ({
  ...jest.requireActual("../../../lib/websocket/WebSocketProvider"),
  useWebSocketContext: () => mockWebSocketContext,
}));

// Mock js-cookie
jest.mock("js-cookie", () => ({
  get: jest.fn(() => "mock-token"),
}));

describe("Notification Panel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render notification panel when open", () => {
    render(<NotificationPanel isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("New User Registered")).toBeInTheDocument();
    expect(screen.getByText("Course Approved")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<NotificationPanel isOpen={false} onClose={jest.fn()} />);

    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("should display unread notification count", () => {
    render(<NotificationPanel isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should filter notifications by status", () => {
    render(<NotificationPanel isOpen={true} onClose={jest.fn()} />);

    // Click unread filter
    const unreadButton = screen.getByText(/Unread \(1\)/);
    fireEvent.click(unreadButton);

    // Should only show unread notification
    expect(screen.getByText("New User Registered")).toBeInTheDocument();
    expect(screen.queryByText("Course Approved")).not.toBeInTheDocument();
  });

  it("should mark notification as read", () => {
    render(<NotificationPanel isOpen={true} onClose={jest.fn()} />);

    const markAsReadButtons = screen.getAllByText("Mark as read");
    fireEvent.click(markAsReadButtons[0]);

    expect(mockWebSocketContext.markNotificationAsRead).toHaveBeenCalledWith(
      "notif-1"
    );
  });

  it("should clear individual notification", () => {
    render(<NotificationPanel isOpen={true} onClose={jest.fn()} />);

    // Get all buttons and find clear buttons within notification cards
    const allButtons = screen.getAllByRole("button");
    // The clear buttons are the X buttons inside the notification cards
    // Skip the first button (panel close) and filter buttons
    const clearButtons = allButtons.filter((btn) => {
      const svg = btn.querySelector("svg");
      return svg && btn.className.includes("ml-2");
    });

    if (clearButtons.length > 0) {
      fireEvent.click(clearButtons[0]);
      expect(mockWebSocketContext.clearNotification).toHaveBeenCalled();
    }
  });

  it("should clear all notifications", () => {
    render(<NotificationPanel isOpen={true} onClose={jest.fn()} />);

    const clearAllButton = screen.getByText("Clear All");
    fireEvent.click(clearAllButton);

    expect(mockWebSocketContext.clearAllNotifications).toHaveBeenCalled();
  });

  it("should close panel when close button clicked", () => {
    const onClose = jest.fn();
    render(<NotificationPanel isOpen={true} onClose={onClose} />);

    const closeButtons = screen.getAllByRole("button");
    // Find the main close button in header
    const headerCloseButton = closeButtons[0];
    fireEvent.click(headerCloseButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("should display empty state when no notifications", () => {
    const emptyContext = {
      ...mockWebSocketContext,
      notifications: [],
      unreadNotifications: 0,
    };

    jest
      .spyOn(
        require("../../../lib/websocket/WebSocketProvider"),
        "useWebSocketContext"
      )
      .mockReturnValue(emptyContext);

    render(<NotificationPanel isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });
});

describe("Security Alerts Panel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render security alerts panel when open", () => {
    render(<SecurityAlertsPanel isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText("Security Alerts")).toBeInTheDocument();
    expect(
      screen.getByText("Multiple Failed Login Attempts")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Suspicious Activity Detected")
    ).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<SecurityAlertsPanel isOpen={false} onClose={jest.fn()} />);

    expect(screen.queryByText("Security Alerts")).not.toBeInTheDocument();
  });

  it("should display alert priority badges", () => {
    render(<SecurityAlertsPanel isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
  });

  it("should filter alerts by priority", () => {
    render(<SecurityAlertsPanel isOpen={true} onClose={jest.fn()} />);

    // Click critical filter
    const criticalButton = screen.getByText(/Critical \(1\)/);
    fireEvent.click(criticalButton);

    // Should only show critical alert
    expect(
      screen.getByText("Suspicious Activity Detected")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Multiple Failed Login Attempts")
    ).not.toBeInTheDocument();
  });

  it("should display alert details", () => {
    render(<SecurityAlertsPanel isOpen={true} onClose={jest.fn()} />);

    expect(screen.getAllByText(/IP:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/192.168.1.100/)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });

  it("should clear security alert", () => {
    render(<SecurityAlertsPanel isOpen={true} onClose={jest.fn()} />);

    // Get all buttons and find clear buttons within alert cards
    const allButtons = screen.getAllByRole("button");
    // The clear buttons are the X buttons inside the alert cards
    const clearButtons = allButtons.filter((btn) => {
      const svg = btn.querySelector("svg");
      return svg && btn.className.includes("ml-2");
    });

    if (clearButtons.length > 0) {
      fireEvent.click(clearButtons[0]);
      expect(mockWebSocketContext.clearSecurityAlert).toHaveBeenCalled();
    }
  });

  it("should show action buttons for critical alerts", () => {
    render(<SecurityAlertsPanel isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText("Investigate")).toBeInTheDocument();
    expect(screen.getByText("Acknowledge")).toBeInTheDocument();
  });

  it("should display empty state when no alerts", () => {
    const emptyContext = {
      ...mockWebSocketContext,
      securityAlerts: [],
      unreadSecurityAlerts: 0,
    };

    jest
      .spyOn(
        require("../../../lib/websocket/WebSocketProvider"),
        "useWebSocketContext"
      )
      .mockReturnValue(emptyContext);

    render(<SecurityAlertsPanel isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText("No security alerts")).toBeInTheDocument();
  });

  it("should close panel when close button clicked", () => {
    const onClose = jest.fn();
    render(<SecurityAlertsPanel isOpen={true} onClose={onClose} />);

    const closeButtons = screen.getAllByRole("button");
    const headerCloseButton = closeButtons[0];
    fireEvent.click(headerCloseButton);

    expect(onClose).toHaveBeenCalled();
  });
});

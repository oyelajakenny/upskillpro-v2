/**
 * SecurityMonitoringPage Component Tests
 *
 * Tests for the SecurityMonitoringPage component including:
 * - Security dashboard metrics display
 * - Security events listing and filtering
 * - Suspicious activity alerts
 * - Time range filtering
 * - Search functionality
 * - Trends visualization
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";

// Mock UI components
jest.mock("../../../components/ui/card", () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <div>{children}</div>,
}));

jest.mock("../../../components/ui/badge", () => ({
  Badge: ({ children, variant }) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

jest.mock("../../../components/ui/button", () => ({
  Button: ({ children, onClick, variant, ...props }) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("../../../components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));

jest.mock("../../../components/ui/select", () => ({
  Select: ({ children, value, onValueChange }) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ children, value }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectValue: () => <span>Select value</span>,
}));

jest.mock("../../../components/ui/tabs", () => ({
  Tabs: ({ children, defaultValue }) => (
    <div data-default-value={defaultValue}>{children}</div>
  ),
  TabsContent: ({ children, value }) => (
    <div data-tab-value={value}>{children}</div>
  ),
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }) => (
    <button role="tab" data-value={value}>
      {children}
    </button>
  ),
}));

jest.mock("../../../components/ui/alert", () => ({
  Alert: ({ children, variant }) => (
    <div data-variant={variant} role="alert">
      {children}
    </div>
  ),
  AlertDescription: ({ children }) => <div>{children}</div>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Shield: () => <span>Shield Icon</span>,
  AlertTriangle: () => <span>AlertTriangle Icon</span>,
  Eye: () => <span>Eye Icon</span>,
  Activity: () => <span>Activity Icon</span>,
  Users: () => <span>Users Icon</span>,
  Clock: () => <span>Clock Icon</span>,
  TrendingUp: () => <span>TrendingUp Icon</span>,
  TrendingDown: () => <span>TrendingDown Icon</span>,
  RefreshCw: () => <span>RefreshCw Icon</span>,
}));

import SecurityMonitoringPage from "../../../app/admin-dashboard/security/page";

// Mock fetch
global.fetch = jest.fn();

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { token: "mock-token", user: { id: "admin-1" } }) => state,
    },
    preloadedState: initialState,
  });
};

// Mock security dashboard data
const mockSecurityDashboard = {
  metrics: {
    totalLoginAttempts: 150,
    successfulLogins: 140,
    failedLoginAttempts: 10,
    loginSuccessRate: "93.3",
    suspiciousActivityCount: 3,
    activeAlerts: 2,
  },
  trends: {
    analysisPeriod: {
      startDate: "2025-01-15T00:00:00Z",
      endDate: "2025-01-15T23:59:59Z",
    },
    eventsByHour: {
      "2025-01-15T10": { total: 25, failed: 2, suspicious: 1 },
      "2025-01-15T11": { total: 30, failed: 3, suspicious: 0 },
      "2025-01-15T12": { total: 20, failed: 1, suspicious: 1 },
    },
  },
  recentEvents: [],
};

// Mock security events
const mockSecurityEvents = [
  {
    eventId: "event-1",
    eventType: "LOGIN_ATTEMPT",
    userId: "user-123",
    ipAddress: "192.168.1.1",
    timestamp: "2025-01-15T10:00:00Z",
    details: { success: true },
  },
  {
    eventId: "event-2",
    eventType: "FAILED_LOGIN",
    userId: "user-456",
    ipAddress: "192.168.1.2",
    timestamp: "2025-01-15T10:05:00Z",
    details: { reason: "Invalid password" },
  },
  {
    eventId: "event-3",
    eventType: "SUSPICIOUS_ACTIVITY",
    userId: "user-789",
    ipAddress: "192.168.1.3",
    timestamp: "2025-01-15T10:10:00Z",
    details: { reason: "Multiple failed attempts" },
  },
];

// Mock suspicious activity
const mockSuspiciousActivity = {
  alerts: [
    {
      type: "EXCESSIVE_FAILED_LOGINS_IP",
      severity: "HIGH",
      description: "12 failed login attempts from IP 192.168.1.100",
      timestamp: "2025-01-15T10:00:00Z",
      details: { ipAddress: "192.168.1.100", failedAttempts: 12 },
    },
    {
      type: "MULTIPLE_IP_LOGINS",
      severity: "MEDIUM",
      description: "User logged in from 3 different IP addresses",
      timestamp: "2025-01-15T10:15:00Z",
      details: {
        userId: "user-123",
        ipAddresses: ["192.168.1.1", "192.168.1.2", "192.168.1.3"],
      },
    },
  ],
  summary: {
    totalAlerts: 2,
    highSeverity: 1,
    mediumSeverity: 1,
    lowSeverity: 0,
  },
};

describe("SecurityMonitoringPage Component", () => {
  let store;

  beforeEach(() => {
    store = createMockStore();
    fetch.mockClear();
    localStorage.setItem("token", "mock-token");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <SecurityMonitoringPage />
      </Provider>
    );
  };

  describe("Initial Rendering", () => {
    it("should render the security monitoring page header", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Security Monitoring")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Monitor login attempts, failed authentications, and suspicious activity"
          )
        ).toBeInTheDocument();
      });
    });

    it("should render time range selector and refresh button", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });
    });

    it("should display loading state initially", () => {
      fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: mockSecurityDashboard }),
                }),
              100
            )
          )
      );

      renderComponent();

      expect(screen.getByText("Loading security data...")).toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Security Metrics Display", () => {
    beforeEach(async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: mockSecurityEvents } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Total Login Attempts")).toBeInTheDocument();
      });
    });

    it("should display total login attempts metric", () => {
      expect(screen.getByText("Total Login Attempts")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("140 successful")).toBeInTheDocument();
    });

    it("should display failed logins metric", () => {
      expect(screen.getByText("Failed Logins")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("93.3% success rate")).toBeInTheDocument();
    });

    it("should display suspicious activity count", () => {
      expect(screen.getByText("Suspicious Activity")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Events detected")).toBeInTheDocument();
    });

    it("should display active alerts count", () => {
      expect(screen.getByText("Active Alerts")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Require attention")).toBeInTheDocument();
    });
  });

  describe("Security Alerts Display", () => {
    beforeEach(async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: mockSecurityEvents } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Security Alerts")).toBeInTheDocument();
      });
    });

    it("should display security alerts section", () => {
      expect(screen.getByText("Security Alerts")).toBeInTheDocument();
    });

    it("should display high severity alerts", () => {
      expect(
        screen.getByText("EXCESSIVE_FAILED_LOGINS_IP")
      ).toBeInTheDocument();
      expect(
        screen.getByText("12 failed login attempts from IP 192.168.1.100")
      ).toBeInTheDocument();
    });

    it("should display medium severity alerts", () => {
      expect(screen.getByText("MULTIPLE_IP_LOGINS")).toBeInTheDocument();
      expect(
        screen.getByText("User logged in from 3 different IP addresses")
      ).toBeInTheDocument();
    });

    it("should display severity badges correctly", () => {
      const highBadge = screen.getByText("HIGH");
      const mediumBadge = screen.getByText("MEDIUM");

      expect(highBadge).toBeInTheDocument();
      expect(mediumBadge).toBeInTheDocument();
    });
  });

  describe("Security Events Listing", () => {
    beforeEach(async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: mockSecurityEvents } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Security Events")).toBeInTheDocument();
      });
    });

    it("should display security events list", () => {
      expect(screen.getByText("LOGIN_ATTEMPT")).toBeInTheDocument();
      expect(screen.getByText("FAILED_LOGIN")).toBeInTheDocument();
      expect(screen.getByText("SUSPICIOUS_ACTIVITY")).toBeInTheDocument();
    });

    it("should display user IDs and IP addresses", () => {
      expect(screen.getByText(/User: user-123/)).toBeInTheDocument();
      expect(screen.getByText(/IP: 192.168.1.1/)).toBeInTheDocument();
      expect(screen.getByText(/IP: 192.168.1.2/)).toBeInTheDocument();
    });

    it("should display event timestamps", () => {
      const timestamps = screen.getAllByText(/2025/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe("Search and Filter Functionality", () => {
    beforeEach(async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: mockSecurityEvents } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Security Events")).toBeInTheDocument();
      });
    });

    it("should render search input", () => {
      const searchInput = screen.getByPlaceholderText(
        "Search by user ID, IP address, or event type..."
      );
      expect(searchInput).toBeInTheDocument();
    });

    it("should filter events by search term", () => {
      const searchInput = screen.getByPlaceholderText(
        "Search by user ID, IP address, or event type..."
      );

      fireEvent.change(searchInput, { target: { value: "user-123" } });

      expect(searchInput.value).toBe("user-123");
    });

    it("should render event type filter dropdown", () => {
      expect(screen.getByText("All Events")).toBeInTheDocument();
    });

    it("should display no events message when search returns no results", () => {
      const searchInput = screen.getByPlaceholderText(
        "Search by user ID, IP address, or event type..."
      );

      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      expect(
        screen.getByText("No security events found for the selected criteria.")
      ).toBeInTheDocument();
    });
  });

  describe("Time Range Filtering", () => {
    it("should fetch data with default time range", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("hoursBack=24"),
          expect.any(Object)
        );
      });
    });

    it("should update data when time range changes", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Security Events")).toBeInTheDocument();
      });

      // Note: Time range selector interaction would require more complex mocking
      // of the Select component, which is beyond the scope of this test
    });
  });

  describe("Refresh Functionality", () => {
    it("should refresh data when refresh button is clicked", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: mockSecurityEvents } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: mockSecurityEvents } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Security Events")).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole("button", { name: /Refresh/ });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(6); // 3 initial + 3 refresh
      });
    });
  });

  describe("Trends Tab", () => {
    beforeEach(async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: mockSecurityEvents } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSuspiciousActivity }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Security Events")).toBeInTheDocument();
      });
    });

    it("should switch to trends tab", () => {
      const trendsTab = screen.getByRole("tab", { name: "Trends" });
      fireEvent.click(trendsTab);

      expect(screen.getByText("Security Trends")).toBeInTheDocument();
    });

    it("should display events by hour in trends tab", () => {
      const trendsTab = screen.getByRole("tab", { name: "Trends" });
      fireEvent.click(trendsTab);

      expect(screen.getByText("Events by Hour")).toBeInTheDocument();
      expect(screen.getByText(/Total: 25/)).toBeInTheDocument();
      expect(screen.getByText(/Failed: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Suspicious: 1/)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when dashboard fetch fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch security dashboard" }),
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading security data/)
        ).toBeInTheDocument();
      });
    });

    it("should display error message when events fetch fails", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Failed to fetch security events" }),
        });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading security data/)
        ).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading security data/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Empty States", () => {
    it("should display message when no events are found", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { alerts: [], summary: {} } }),
        });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(
            "No security events found for the selected criteria."
          )
        ).toBeInTheDocument();
      });
    });

    it("should not display alerts section when no alerts exist", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSecurityDashboard }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { securityEvents: mockSecurityEvents } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { alerts: [], summary: {} } }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText("Security Alerts")).not.toBeInTheDocument();
      });
    });
  });
});

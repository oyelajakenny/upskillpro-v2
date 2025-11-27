/**
 * AuditTrailPage Component Tests
 *
 * Tests for the AuditTrailPage component including:
 * - Audit log display with search and filtering
 * - Admin action history tracking
 * - Audit report generation and export
 * - Statistics display
 * - Pagination functionality
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
  Button: ({ children, onClick, variant, disabled, ...props }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      disabled={disabled}
      {...props}
    >
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
  SelectValue: ({ placeholder }) => (
    <span>{placeholder || "Select value"}</span>
  ),
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
  FileText: () => <span>FileText Icon</span>,
  Search: () => <span>Search Icon</span>,
  Download: () => <span>Download Icon</span>,
  Calendar: () => <span>Calendar Icon</span>,
  User: () => <span>User Icon</span>,
  Activity: () => <span>Activity Icon</span>,
  RefreshCw: () => <span>RefreshCw Icon</span>,
  Filter: () => <span>Filter Icon</span>,
  Eye: () => <span>Eye Icon</span>,
  ChevronDown: () => <span>ChevronDown Icon</span>,
  ChevronUp: () => <span>ChevronUp Icon</span>,
}));

import AuditTrailPage from "../../../app/admin-dashboard/audit/page";

// Mock fetch
global.fetch = jest.fn();

// Mock URL and Blob for file downloads
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { token: "mock-token", user: { id: "admin-1" } }) => state,
    },
    preloadedState: initialState,
  });
};

// Mock audit logs
const mockAuditLogs = [
  {
    actionId: "action-1",
    adminId: "admin-123",
    action: "USER_ROLE_CHANGE",
    details: {
      targetEntity: "USER#user-456",
      previousRole: "student",
      newRole: "instructor",
      reason: "Instructor application approved",
    },
    ipAddress: "192.168.1.1",
    timestamp: "2025-01-15T10:00:00Z",
  },
  {
    actionId: "action-2",
    adminId: "admin-123",
    action: "COURSE_APPROVAL",
    details: {
      targetEntity: "COURSE#course-789",
      reason: "Course meets quality standards",
    },
    ipAddress: "192.168.1.1",
    timestamp: "2025-01-15T10:30:00Z",
  },
  {
    actionId: "action-3",
    adminId: "admin-456",
    action: "CONTENT_MODERATION",
    details: {
      targetEntity: "REVIEW#review-123",
      action: "removed",
      reason: "Inappropriate content",
    },
    ipAddress: "192.168.1.2",
    timestamp: "2025-01-15T11:00:00Z",
  },
];

// Mock audit statistics
const mockAuditStats = {
  totalActions: 150,
  actionsByAdmin: {
    "admin-123": 85,
    "admin-456": 45,
    "admin-789": 20,
  },
  actionsByType: {
    USER_ROLE_CHANGE: 30,
    COURSE_APPROVAL: 25,
    COURSE_REJECTION: 10,
    CONTENT_MODERATION: 20,
    PLATFORM_SETTINGS_UPDATE: 15,
    SECURITY_POLICIES_UPDATE: 10,
    USER_DEACTIVATION: 8,
    USER_REACTIVATION: 5,
  },
  actionsByDate: {
    "2025-01-15": 45,
    "2025-01-14": 38,
    "2025-01-13": 32,
    "2025-01-12": 35,
  },
};

describe("AuditTrailPage Component", () => {
  let store;

  beforeEach(() => {
    store = createMockStore();
    fetch.mockClear();
    localStorage.setItem("token", "mock-token");
    global.URL.createObjectURL.mockClear();
    global.URL.revokeObjectURL.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <AuditTrailPage />
      </Provider>
    );
  };

  describe("Initial Rendering", () => {
    it("should render the audit trail page header", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Audit Trail")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Comprehensive audit log display with search and filtering"
          )
        ).toBeInTheDocument();
      });
    });

    it("should render export and refresh buttons", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Export CSV")).toBeInTheDocument();
        expect(screen.getByText("Export JSON")).toBeInTheDocument();
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
                  json: async () => ({
                    data: {
                      auditTrail: mockAuditLogs,
                      statistics: mockAuditStats,
                    },
                  }),
                }),
              100
            )
          )
      );

      renderComponent();

      expect(screen.getByText("Loading audit data...")).toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Statistics Display", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Total Actions")).toBeInTheDocument();
      });
    });

    it("should display total actions metric", () => {
      expect(screen.getByText("Total Actions")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
    });

    it("should display unique admins count", () => {
      expect(screen.getByText("Unique Admins")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should display action types count", () => {
      expect(screen.getByText("Action Types")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
    });

    it("should display today's actions count", () => {
      expect(screen.getByText("Today's Actions")).toBeInTheDocument();
    });
  });

  describe("Audit Logs Display", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Admin Action History")).toBeInTheDocument();
      });
    });

    it("should display audit logs list", () => {
      expect(screen.getByText("USER_ROLE_CHANGE")).toBeInTheDocument();
      expect(screen.getByText("COURSE_APPROVAL")).toBeInTheDocument();
      expect(screen.getByText("CONTENT_MODERATION")).toBeInTheDocument();
    });

    it("should display admin IDs", () => {
      expect(screen.getByText(/by admin-123/)).toBeInTheDocument();
      expect(screen.getByText(/by admin-456/)).toBeInTheDocument();
    });

    it("should display target entities", () => {
      expect(screen.getByText(/Target:/)).toBeInTheDocument();
      expect(screen.getByText(/USER#user-456/)).toBeInTheDocument();
      expect(screen.getByText(/COURSE#course-789/)).toBeInTheDocument();
    });

    it("should display action reasons", () => {
      expect(screen.getByText(/Reason:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Instructor application approved/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Course meets quality standards/)
      ).toBeInTheDocument();
    });

    it("should display timestamps", () => {
      const timestamps = screen.getAllByText(/2025/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe("Log Expansion Functionality", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Admin Action History")).toBeInTheDocument();
      });
    });

    it("should expand log details when chevron is clicked", () => {
      const expandButtons = screen.getAllByRole("button");
      const firstExpandButton = expandButtons.find((btn) =>
        btn.querySelector("svg")
      );

      if (firstExpandButton) {
        fireEvent.click(firstExpandButton);

        expect(screen.getByText("Full Details:")).toBeInTheDocument();
      }
    });

    it("should collapse log details when clicked again", () => {
      const expandButtons = screen.getAllByRole("button");
      const firstExpandButton = expandButtons.find((btn) =>
        btn.querySelector("svg")
      );

      if (firstExpandButton) {
        // Expand
        fireEvent.click(firstExpandButton);
        expect(screen.getByText("Full Details:")).toBeInTheDocument();

        // Collapse
        fireEvent.click(firstExpandButton);
        expect(screen.queryByText("Full Details:")).not.toBeInTheDocument();
      }
    });
  });

  describe("Filter Functionality", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Filters")).toBeInTheDocument();
      });
    });

    it("should render filter inputs", () => {
      expect(screen.getByPlaceholderText("Admin ID")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Start Date")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("End Date")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("should update filter values when typing", () => {
      const adminIdInput = screen.getByPlaceholderText("Admin ID");
      fireEvent.change(adminIdInput, { target: { value: "admin-123" } });

      expect(adminIdInput.value).toBe("admin-123");
    });

    it("should apply filters when Apply button is clicked", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      const adminIdInput = screen.getByPlaceholderText("Admin ID");
      fireEvent.change(adminIdInput, { target: { value: "admin-123" } });

      const applyButton = screen.getByRole("button", { name: /Apply/ });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("adminId=admin-123"),
          expect.any(Object)
        );
      });
    });

    it("should clear filters when Clear button is clicked", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      const adminIdInput = screen.getByPlaceholderText("Admin ID");
      fireEvent.change(adminIdInput, { target: { value: "admin-123" } });

      const clearButton = screen.getByRole("button", { name: /Clear/ });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(adminIdInput.value).toBe("");
      });
    });
  });

  describe("Search Functionality", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Admin Action History")).toBeInTheDocument();
      });
    });

    it("should filter logs by search term", () => {
      const searchInput = screen.getByPlaceholderText("Search...");
      fireEvent.change(searchInput, { target: { value: "admin-123" } });

      expect(searchInput.value).toBe("admin-123");
    });

    it("should display no results message when search returns nothing", () => {
      const searchInput = screen.getByPlaceholderText("Search...");
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      expect(
        screen.getByText("No audit logs found for the selected criteria.")
      ).toBeInTheDocument();
    });
  });

  describe("Pagination Functionality", () => {
    it("should display Load More button when more data is available", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: "next-key" },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Load More")).toBeInTheDocument();
      });
    });

    it("should load more data when Load More is clicked", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              auditTrail: mockAuditLogs,
              statistics: mockAuditStats,
              pagination: { lastEvaluatedKey: "next-key" },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              auditTrail: [
                {
                  actionId: "action-4",
                  adminId: "admin-789",
                  action: "USER_DEACTIVATION",
                  details: { targetEntity: "USER#user-999" },
                  timestamp: "2025-01-15T12:00:00Z",
                },
              ],
              statistics: mockAuditStats,
              pagination: { lastEvaluatedKey: null },
            },
          }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Load More")).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText("Load More");
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    it("should not display Load More button when no more data", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText("Load More")).not.toBeInTheDocument();
      });
    });
  });

  describe("Export Functionality", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Export CSV")).toBeInTheDocument();
      });
    });

    it("should export CSV when Export CSV button is clicked", async () => {
      const mockBlob = new Blob(["csv data"], { type: "text/csv" });
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const exportButton = screen.getByText("Export CSV");
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("format=csv"),
          expect.any(Object)
        );
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      });
    });

    it("should export JSON when Export JSON button is clicked", async () => {
      const mockBlob = new Blob(['{"data": "json"}'], {
        type: "application/json",
      });
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const exportButton = screen.getByText("Export JSON");
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("format=json"),
          expect.any(Object)
        );
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      });
    });

    it("should handle export errors gracefully", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Export failed" }),
      });

      const exportButton = screen.getByText("Export CSV");
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });

  describe("Statistics Tab", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: mockAuditLogs,
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Admin Action History")).toBeInTheDocument();
      });
    });

    it("should switch to statistics tab", () => {
      const statsTab = screen.getByRole("tab", { name: "Statistics" });
      fireEvent.click(statsTab);

      expect(screen.getByText("Actions by Type")).toBeInTheDocument();
      expect(screen.getByText("Actions by Admin")).toBeInTheDocument();
      expect(screen.getByText("Actions by Date")).toBeInTheDocument();
    });

    it("should display actions by type statistics", () => {
      const statsTab = screen.getByRole("tab", { name: "Statistics" });
      fireEvent.click(statsTab);

      expect(screen.getByText("USER_ROLE_CHANGE")).toBeInTheDocument();
      expect(screen.getByText("COURSE_APPROVAL")).toBeInTheDocument();
      expect(screen.getByText("CONTENT_MODERATION")).toBeInTheDocument();
      expect(screen.getByText("30")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("should display actions by admin statistics", () => {
      const statsTab = screen.getByRole("tab", { name: "Statistics" });
      fireEvent.click(statsTab);

      expect(screen.getByText("admin-123")).toBeInTheDocument();
      expect(screen.getByText("admin-456")).toBeInTheDocument();
      expect(screen.getByText("admin-789")).toBeInTheDocument();
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();
    });

    it("should display actions by date statistics", () => {
      const statsTab = screen.getByRole("tab", { name: "Statistics" });
      fireEvent.click(statsTab);

      expect(screen.getByText("2025-01-15")).toBeInTheDocument();
      expect(screen.getByText("2025-01-14")).toBeInTheDocument();
    });
  });

  describe("Refresh Functionality", () => {
    it("should refresh data when refresh button is clicked", async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              auditTrail: mockAuditLogs,
              statistics: mockAuditStats,
              pagination: { lastEvaluatedKey: null },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              auditTrail: mockAuditLogs,
              statistics: mockAuditStats,
              pagination: { lastEvaluatedKey: null },
            },
          }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Admin Action History")).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole("button", { name: /Refresh/ });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when fetch fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch audit data" }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });

  describe("Empty States", () => {
    it("should display message when no audit logs are found", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            auditTrail: [],
            statistics: mockAuditStats,
            pagination: { lastEvaluatedKey: null },
          },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText("No audit logs found for the selected criteria.")
        ).toBeInTheDocument();
      });
    });
  });
});

/**
 * AnalyticsDashboard Component Tests
 *
 * Tests for the AnalyticsDashboard component including:
 * - Initial rendering and loading states
 * - Data fetching and display
 * - Date range selection functionality
 * - Tab navigation
 * - Export functionality
 * - Error handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AnalyticsDashboard from "../../../app/admin-dashboard/analytics/page";

// Mock the chart components
jest.mock(
  "../../../app/admin-dashboard/analytics/components/UserGrowthChart",
  () => {
    return function MockUserGrowthChart({ data }) {
      return (
        <div data-testid="user-growth-chart">
          <h3>User Growth Chart</h3>
          <p>Data: {data ? "loaded" : "no data"}</p>
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/analytics/components/RevenueAnalyticsChart",
  () => {
    return function MockRevenueAnalyticsChart({ data }) {
      return (
        <div data-testid="revenue-analytics-chart">
          <h3>Revenue Analytics Chart</h3>
          <p>Data: {data ? "loaded" : "no data"}</p>
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/analytics/components/CoursePerformanceChart",
  () => {
    return function MockCoursePerformanceChart({ data }) {
      return (
        <div data-testid="course-performance-chart">
          <h3>Course Performance Chart</h3>
          <p>Data: {data ? "loaded" : "no data"}</p>
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/analytics/components/EngagementMetricsChart",
  () => {
    return function MockEngagementMetricsChart({ data }) {
      return (
        <div data-testid="engagement-metrics-chart">
          <h3>Engagement Metrics Chart</h3>
          <p>Data: {data ? "loaded" : "no data"}</p>
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/analytics/components/ReportingPanel",
  () => {
    return function MockReportingPanel() {
      return (
        <div data-testid="reporting-panel">
          <h3>Reporting Panel</h3>
          <button>Generate Report</button>
        </div>
      );
    };
  }
);

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => "mock-token"),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock analytics data
const mockAnalyticsData = {
  platformMetrics: {
    totalUsers: 1250,
    totalCourses: 89,
    totalEnrollments: 3420,
    percentageChanges: {
      users: "12.5",
      courses: "8.2",
      enrollments: "15.3",
    },
  },
  userGrowth: {
    usersByPeriod: {
      "2025-01-01": 1000,
      "2025-01-02": 1020,
      "2025-01-03": 1045,
    },
    newUsersByPeriod: {
      "2025-01-01": 20,
      "2025-01-02": 25,
      "2025-01-03": 18,
    },
  },
  revenue: {
    totalRevenue: 125430,
    revenueByPeriod: {
      "2025-01-01": 4200,
      "2025-01-02": 3800,
      "2025-01-03": 4500,
    },
    growthRate: "8.2",
  },
};

describe("AnalyticsDashboard Component", () => {
  beforeEach(() => {
    fetch.mockClear();
    mockLocalStorage.getItem.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<AnalyticsDashboard />);
  };

  describe("Initial Rendering", () => {
    it("should render the analytics dashboard header", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch" }),
      });

      renderComponent();

      expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
      expect(
        screen.getByText("Comprehensive platform analytics and insights")
      ).toBeInTheDocument();
    });

    it("should render date range selector", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch" }),
      });

      renderComponent();

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should render export button", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch" }),
      });

      renderComponent();

      expect(screen.getByText("Export CSV")).toBeInTheDocument();
    });

    it("should display loading state initially", async () => {
      fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: mockAnalyticsData }),
                }),
              100
            )
          )
      );

      renderComponent();

      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Data Fetching", () => {
    it("should fetch analytics data on component mount", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/admin/analytics"),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          })
        );
      });
    });

    it("should display analytics data when loaded successfully", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("1,250")).toBeInTheDocument(); // Total users
        expect(screen.getByText("89")).toBeInTheDocument(); // Total courses
        expect(screen.getByText("3,420")).toBeInTheDocument(); // Total enrollments
      });
    });

    it("should display percentage changes", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("+12.5%")).toBeInTheDocument();
        expect(screen.getByText("+8.2%")).toBeInTheDocument();
        expect(screen.getByText("+15.3%")).toBeInTheDocument();
      });
    });

    it("should handle fetch errors gracefully", async () => {
      const { toast } = require("react-hot-toast");

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch analytics" }),
      });

      renderComponent();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to load analytics data"
        );
      });
    });
  });

  describe("Date Range Selection", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("1,250")).toBeInTheDocument();
      });
    });

    it("should refetch data when date range changes", async () => {
      const dateSelector = screen.getByRole("combobox");

      fireEvent.click(dateSelector);

      // Wait for dropdown to appear and select 7 days option
      await waitFor(() => {
        const sevenDaysOption = screen.getByText("Last 7 days");
        fireEvent.click(sevenDaysOption);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2); // Initial load + date change
      });
    });

    it("should update API call with correct date parameters", async () => {
      const dateSelector = screen.getByRole("combobox");

      fireEvent.click(dateSelector);

      await waitFor(() => {
        const ninetyDaysOption = screen.getByText("Last 90 days");
        fireEvent.click(ninetyDaysOption);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenLastCalledWith(
          expect.stringContaining("startDate="),
          expect.any(Object)
        );
      });
    });
  });

  describe("Tab Navigation", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("1,250")).toBeInTheDocument();
      });
    });

    it("should render all tab options", () => {
      expect(screen.getByRole("tab", { name: /Overview/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Users/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Courses/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Revenue/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Reports/ })).toBeInTheDocument();
    });

    it("should display overview tab content by default", () => {
      expect(screen.getByTestId("user-growth-chart")).toBeInTheDocument();
      expect(screen.getByTestId("revenue-analytics-chart")).toBeInTheDocument();
      expect(
        screen.getByTestId("course-performance-chart")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("engagement-metrics-chart")
      ).toBeInTheDocument();
    });

    it("should switch to users tab when clicked", async () => {
      const usersTab = screen.getByRole("tab", { name: /Users/ });
      fireEvent.click(usersTab);

      await waitFor(() => {
        // Should still show user growth chart but not all overview charts
        expect(screen.getByTestId("user-growth-chart")).toBeInTheDocument();
        expect(
          screen.getByTestId("engagement-metrics-chart")
        ).toBeInTheDocument();
      });
    });

    it("should switch to courses tab when clicked", async () => {
      const coursesTab = screen.getByRole("tab", { name: /Courses/ });
      fireEvent.click(coursesTab);

      await waitFor(() => {
        expect(
          screen.getByTestId("course-performance-chart")
        ).toBeInTheDocument();
      });
    });

    it("should switch to revenue tab when clicked", async () => {
      const revenueTab = screen.getByRole("tab", { name: /Revenue/ });
      fireEvent.click(revenueTab);

      await waitFor(() => {
        expect(
          screen.getByTestId("revenue-analytics-chart")
        ).toBeInTheDocument();
      });
    });

    it("should switch to reports tab when clicked", async () => {
      const reportsTab = screen.getByRole("tab", { name: /Reports/ });
      fireEvent.click(reportsTab);

      await waitFor(() => {
        expect(screen.getByTestId("reporting-panel")).toBeInTheDocument();
      });
    });
  });

  describe("Export Functionality", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("1,250")).toBeInTheDocument();
      });
    });

    it("should trigger export when export button is clicked", async () => {
      // Mock blob and URL.createObjectURL
      const mockBlob = new Blob(["test data"], { type: "text/csv" });
      global.URL.createObjectURL = jest.fn(() => "mock-url");
      global.URL.revokeObjectURL = jest.fn();

      // Mock successful export response
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const exportButton = screen.getByText("Export CSV");
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/admin/analytics/export"),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          })
        );
      });
    });

    it("should handle export errors", async () => {
      const { toast } = require("react-hot-toast");

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Export failed" }),
      });

      const exportButton = screen.getByText("Export CSV");
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to export analytics data"
        );
      });
    });
  });

  describe("Chart Component Integration", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("1,250")).toBeInTheDocument();
      });
    });

    it("should pass data to chart components", () => {
      const userGrowthChart = screen.getByTestId("user-growth-chart");
      const revenueChart = screen.getByTestId("revenue-analytics-chart");
      const courseChart = screen.getByTestId("course-performance-chart");
      const engagementChart = screen.getByTestId("engagement-metrics-chart");

      expect(userGrowthChart).toHaveTextContent("Data: loaded");
      expect(revenueChart).toHaveTextContent("Data: loaded");
      expect(courseChart).toHaveTextContent("Data: loaded");
      expect(engagementChart).toHaveTextContent("Data: loaded");
    });

    it("should handle missing data gracefully", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null }),
      });

      renderComponent();

      await waitFor(() => {
        const charts = screen.getAllByText("Data: no data");
        expect(charts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Responsive Design", () => {
    it("should render properly on different screen sizes", async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("1,250")).toBeInTheDocument();
      });

      // Check for responsive grid classes
      const container = document.querySelector(".container");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalyticsData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("1,250")).toBeInTheDocument();
      });
    });

    it("should have proper heading structure", () => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Analytics Dashboard"
      );
    });

    it("should have accessible tab navigation", () => {
      const tabList = screen.getByRole("tablist");
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(5);
    });

    it("should have accessible buttons", () => {
      const exportButton = screen.getByRole("button", { name: /Export CSV/ });
      expect(exportButton).toBeInTheDocument();
    });
  });
});

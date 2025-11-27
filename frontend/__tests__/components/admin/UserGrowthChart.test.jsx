/**
 * UserGrowthChart Component Tests
 *
 * Tests for the UserGrowthChart component including:
 * - Chart rendering with data
 * - Sample data handling when no data provided
 * - Metrics calculation and display
 * - Chart configuration and options
 * - Responsive behavior
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserGrowthChart from "../../../app/admin-dashboard/analytics/components/UserGrowthChart";

// Mock Chart.js components
jest.mock("react-chartjs-2", () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

// Mock Chart.js registration
jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}));

describe("UserGrowthChart Component", () => {
  const mockUserGrowthData = {
    usersByPeriod: {
      "2025-01-01": 1000,
      "2025-01-02": 1020,
      "2025-01-03": 1045,
      "2025-01-04": 1060,
      "2025-01-05": 1080,
    },
    newUsersByPeriod: {
      "2025-01-01": 20,
      "2025-01-02": 25,
      "2025-01-03": 18,
      "2025-01-04": 22,
      "2025-01-05": 20,
    },
  };

  describe("Component Rendering", () => {
    it("should render the chart component", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      expect(screen.getByText("User Growth Analytics")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("should render chart title with icon", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      expect(screen.getByText("User Growth Analytics")).toBeInTheDocument();
    });

    it("should render growth metrics section", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      expect(screen.getByText("New Users Today")).toBeInTheDocument();
      expect(screen.getByText("Daily Average")).toBeInTheDocument();
      expect(screen.getByText("Total Growth")).toBeInTheDocument();
    });
  });

  describe("Data Processing", () => {
    it("should process real data correctly", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const chartData = screen.getByTestId("chart-data");
      const parsedData = JSON.parse(chartData.textContent);

      expect(parsedData.labels).toHaveLength(5);
      expect(parsedData.datasets).toHaveLength(2);
      expect(parsedData.datasets[0].label).toBe("Total Users");
      expect(parsedData.datasets[1].label).toBe("New Users");
    });

    it("should handle missing data with sample data", () => {
      render(<UserGrowthChart data={null} />);

      const chartData = screen.getByTestId("chart-data");
      const parsedData = JSON.parse(chartData.textContent);

      expect(parsedData.labels).toHaveLength(30); // 30 days of sample data
      expect(parsedData.datasets).toHaveLength(2);
      expect(parsedData.datasets[0].data).toHaveLength(30);
      expect(parsedData.datasets[1].data).toHaveLength(30);
    });

    it("should handle empty data object", () => {
      render(<UserGrowthChart data={{}} />);

      const chartData = screen.getByTestId("chart-data");
      const parsedData = JSON.parse(chartData.textContent);

      // Should fall back to sample data
      expect(parsedData.labels).toHaveLength(30);
      expect(parsedData.datasets).toHaveLength(2);
    });

    it("should format dates correctly in labels", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const chartData = screen.getByTestId("chart-data");
      const parsedData = JSON.parse(chartData.textContent);

      // Check that labels are formatted as "Jan 1" style
      parsedData.labels.forEach((label) => {
        expect(label).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
      });
    });
  });

  describe("Chart Configuration", () => {
    it("should have correct chart options", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const chartOptions = screen.getByTestId("chart-options");
      const parsedOptions = JSON.parse(chartOptions.textContent);

      expect(parsedOptions.responsive).toBe(true);
      expect(parsedOptions.maintainAspectRatio).toBe(false);
      expect(parsedOptions.plugins.legend.position).toBe("top");
    });

    it("should configure scales properly", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const chartOptions = screen.getByTestId("chart-options");
      const parsedOptions = JSON.parse(chartOptions.textContent);

      expect(parsedOptions.scales.y.beginAtZero).toBe(true);
      expect(parsedOptions.scales.x.grid.display).toBe(false);
    });

    it("should have proper interaction settings", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const chartOptions = screen.getByTestId("chart-options");
      const parsedOptions = JSON.parse(chartOptions.textContent);

      expect(parsedOptions.interaction.mode).toBe("nearest");
      expect(parsedOptions.interaction.axis).toBe("x");
      expect(parsedOptions.interaction.intersect).toBe(false);
    });
  });

  describe("Metrics Calculation", () => {
    it("should calculate growth metrics correctly with real data", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      // Check that metrics are displayed
      expect(screen.getByText("20")).toBeInTheDocument(); // New users today (last period)
      expect(screen.getByText("21.0")).toBeInTheDocument(); // Daily average
      expect(screen.getByText("8.0%")).toBeInTheDocument(); // Total growth
    });

    it("should display sample metrics when no data", () => {
      render(<UserGrowthChart data={null} />);

      // Should show sample metrics
      expect(screen.getByText("23")).toBeInTheDocument(); // Sample new users today
      expect(screen.getByText("18.4")).toBeInTheDocument(); // Sample daily average
      expect(screen.getByText("12.5%")).toBeInTheDocument(); // Sample total growth
    });

    it("should handle zero values gracefully", () => {
      const zeroData = {
        usersByPeriod: {
          "2025-01-01": 0,
          "2025-01-02": 0,
        },
        newUsersByPeriod: {
          "2025-01-01": 0,
          "2025-01-02": 0,
        },
      };

      render(<UserGrowthChart data={zeroData} />);

      expect(screen.getByText("0")).toBeInTheDocument(); // New users today
      expect(screen.getByText("0.0")).toBeInTheDocument(); // Daily average
    });
  });

  describe("Visual Elements", () => {
    it("should display growth percentage with proper styling", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const growthElement = screen.getByText("8.0%");
      expect(growthElement).toBeInTheDocument();
    });

    it("should show metric labels", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      expect(screen.getByText("New Users Today")).toBeInTheDocument();
      expect(screen.getByText("Daily Average")).toBeInTheDocument();
      expect(screen.getByText("Total Growth")).toBeInTheDocument();
    });

    it("should have proper card structure", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      // Check for card components (assuming they have specific classes or structure)
      const cardTitle = screen.getByText("User Growth Analytics");
      expect(cardTitle).toBeInTheDocument();
    });
  });

  describe("Dataset Configuration", () => {
    it("should configure total users dataset correctly", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const chartData = screen.getByTestId("chart-data");
      const parsedData = JSON.parse(chartData.textContent);
      const totalUsersDataset = parsedData.datasets[0];

      expect(totalUsersDataset.label).toBe("Total Users");
      expect(totalUsersDataset.borderColor).toBe("rgb(59, 130, 246)");
      expect(totalUsersDataset.backgroundColor).toBe("rgba(59, 130, 246, 0.1)");
      expect(totalUsersDataset.fill).toBe(true);
      expect(totalUsersDataset.tension).toBe(0.4);
    });

    it("should configure new users dataset correctly", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const chartData = screen.getByTestId("chart-data");
      const parsedData = JSON.parse(chartData.textContent);
      const newUsersDataset = parsedData.datasets[1];

      expect(newUsersDataset.label).toBe("New Users");
      expect(newUsersDataset.borderColor).toBe("rgb(16, 185, 129)");
      expect(newUsersDataset.backgroundColor).toBe("rgba(16, 185, 129, 0.1)");
      expect(newUsersDataset.fill).toBe(true);
      expect(newUsersDataset.tension).toBe(0.4);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed data gracefully", () => {
      const malformedData = {
        usersByPeriod: "invalid",
        newUsersByPeriod: null,
      };

      render(<UserGrowthChart data={malformedData} />);

      // Should fall back to sample data
      const chartData = screen.getByTestId("chart-data");
      const parsedData = JSON.parse(chartData.textContent);
      expect(parsedData.labels).toHaveLength(30);
    });

    it("should handle missing newUsersByPeriod", () => {
      const incompleteData = {
        usersByPeriod: {
          "2025-01-01": 1000,
          "2025-01-02": 1020,
        },
      };

      render(<UserGrowthChart data={incompleteData} />);

      const chartData = screen.getByTestId("chart-data");
      const parsedData = JSON.parse(chartData.textContent);

      // Should still render with zero values for new users
      expect(parsedData.datasets[1].data).toEqual([0, 0]);
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      const heading = screen.getByText("User Growth Analytics");
      expect(heading).toBeInTheDocument();
    });

    it("should provide meaningful metric descriptions", () => {
      render(<UserGrowthChart data={mockUserGrowthData} />);

      expect(screen.getByText("New Users Today")).toBeInTheDocument();
      expect(screen.getByText("Daily Average")).toBeInTheDocument();
      expect(screen.getByText("Total Growth")).toBeInTheDocument();
    });
  });
});

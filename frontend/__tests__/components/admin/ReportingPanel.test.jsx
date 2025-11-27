/**
 * ReportingPanel Component Tests
 *
 * Tests for the ReportingPanel component including:
 * - Report configuration options
 * - Report generation functionality
 * - Email delivery options
 * - Scheduled reporting features
 * - Export format handling
 * - Error handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReportingPanel from "../../../app/admin-dashboard/analytics/components/ReportingPanel";

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

// Mock URL methods for file download
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock document methods for file download
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(document, "createElement", {
  value: jest.fn(() => ({
    style: {},
    click: mockClick,
    setAttribute: jest.fn(),
  })),
});

Object.defineProperty(document.body, "appendChild", { value: mockAppendChild });
Object.defineProperty(document.body, "removeChild", { value: mockRemoveChild });

describe("ReportingPanel Component", () => {
  beforeEach(() => {
    fetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockAppendChild.mockClear();
    mockRemoveChild.mockClear();
    mockClick.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<ReportingPanel />);
  };

  describe("Initial Rendering", () => {
    it("should render the reporting panel header", () => {
      renderComponent();

      expect(
        screen.getByText("Advanced Reporting & Data Export")
      ).toBeInTheDocument();
    });

    it("should render tab navigation", () => {
      renderComponent();

      expect(
        screen.getByRole("tab", { name: "Generate Report" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Scheduled Reports" })
      ).toBeInTheDocument();
    });

    it("should show generate report tab by default", () => {
      renderComponent();

      expect(screen.getByText("Report Configuration")).toBeInTheDocument();
      expect(screen.getByText("Advanced Options")).toBeInTheDocument();
    });
  });

  describe("Report Configuration", () => {
    beforeEach(() => {
      renderComponent();
    });

    it("should render report type selector", () => {
      expect(screen.getByText("Report Type")).toBeInTheDocument();
    });

    it("should render export format selector", () => {
      expect(screen.getByText("Export Format")).toBeInTheDocument();
    });

    it("should render date range selector", () => {
      expect(screen.getByText("Date Range")).toBeInTheDocument();
    });

    it("should show custom date inputs when custom range is selected", async () => {
      // Find and click the date range selector
      const dateRangeSelectors = screen.getAllByRole("combobox");
      const dateRangeSelector = dateRangeSelectors.find(
        (selector) =>
          selector.closest("div").previousElementSibling?.textContent ===
          "Date Range"
      );

      if (dateRangeSelector) {
        fireEvent.click(dateRangeSelector);

        await waitFor(() => {
          const customOption = screen.getByText("Custom range");
          fireEvent.click(customOption);
        });

        await waitFor(() => {
          expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
          expect(screen.getByLabelText("End Date")).toBeInTheDocument();
        });
      }
    });
  });

  describe("Advanced Options", () => {
    beforeEach(() => {
      renderComponent();
    });

    it("should render include charts checkbox", () => {
      expect(
        screen.getByText("Include Charts and Visualizations")
      ).toBeInTheDocument();
    });

    it("should render email delivery checkbox", () => {
      expect(screen.getByText("Email Delivery")).toBeInTheDocument();
    });

    it("should show email input when email delivery is enabled", async () => {
      const emailCheckbox = screen.getByRole("checkbox", {
        name: /Email Delivery/,
      });

      fireEvent.click(emailCheckbox);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("recipient@example.com")
        ).toBeInTheDocument();
      });
    });

    it("should render scheduled reporting checkbox", () => {
      expect(screen.getByText("Create Scheduled Report")).toBeInTheDocument();
    });

    it("should show frequency selector when scheduled reporting is enabled", async () => {
      const scheduledCheckbox = screen.getByRole("checkbox", {
        name: /Create Scheduled Report/,
      });

      fireEvent.click(scheduledCheckbox);

      await waitFor(() => {
        // Look for frequency options
        expect(screen.getByText("Weekly")).toBeInTheDocument();
      });
    });
  });

  describe("Report Generation", () => {
    beforeEach(() => {
      renderComponent();
    });

    it("should generate and download report when button is clicked", async () => {
      const mockBlob = new Blob(["test data"], { type: "text/csv" });

      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const generateButton = screen.getByText("Generate & Download Report");
      fireEvent.click(generateButton);

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

      await waitFor(() => {
        expect(mockAppendChild).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRemoveChild).toHaveBeenCalled();
      });
    });

    it("should show loading state during generation", async () => {
      fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  blob: async () => new Blob(["test"], { type: "text/csv" }),
                }),
              100
            )
          )
      );

      const generateButton = screen.getByText("Generate & Download Report");
      fireEvent.click(generateButton);

      expect(screen.getByText("Generating...")).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByText("Generate & Download Report")
        ).toBeInTheDocument();
      });
    });

    it("should handle generation errors", async () => {
      const { toast } = require("react-hot-toast");

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Generation failed" }),
      });

      const generateButton = screen.getByText("Generate & Download Report");
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to generate report");
      });
    });

    it("should send email when email delivery is enabled", async () => {
      // Enable email delivery
      const emailCheckbox = screen.getByRole("checkbox", {
        name: /Email Delivery/,
      });
      fireEvent.click(emailCheckbox);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText("recipient@example.com");
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      });

      // Mock successful report generation
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(["test"], { type: "text/csv" }),
      });

      // Mock successful email sending
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const generateButton = screen.getByText("Generate & Download Report");
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/admin/reports/email",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining("test@example.com"),
          })
        );
      });
    });
  });

  describe("Scheduled Reports", () => {
    beforeEach(() => {
      renderComponent();

      // Switch to scheduled reports tab
      const scheduledTab = screen.getByRole("tab", {
        name: "Scheduled Reports",
      });
      fireEvent.click(scheduledTab);
    });

    it("should display scheduled reports list", () => {
      expect(screen.getByText("Scheduled Reports")).toBeInTheDocument();
      expect(screen.getByText("Weekly Platform Analytics")).toBeInTheDocument();
      expect(screen.getByText("Monthly Revenue Report")).toBeInTheDocument();
    });

    it("should show report details", () => {
      expect(screen.getByText("weekly")).toBeInTheDocument();
      expect(screen.getByText("monthly")).toBeInTheDocument();
      expect(screen.getByText("PDF")).toBeInTheDocument();
      expect(screen.getByText("CSV")).toBeInTheDocument();
    });

    it("should show recipient information", () => {
      expect(screen.getByText(/admin@upskillpro.com/)).toBeInTheDocument();
      expect(screen.getByText(/finance@upskillpro.com/)).toBeInTheDocument();
    });

    it("should toggle report status when status button is clicked", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const statusButtons = screen.getAllByText("Active");
      fireEvent.click(statusButtons[0]);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/admin/reports/schedule/"),
          expect.objectContaining({
            method: "PATCH",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
              "Content-Type": "application/json",
            }),
          })
        );
      });
    });
  });

  describe("Scheduled Report Creation", () => {
    beforeEach(() => {
      renderComponent();
    });

    it("should create scheduled report when option is enabled", async () => {
      // Enable scheduled reporting
      const scheduledCheckbox = screen.getByRole("checkbox", {
        name: /Create Scheduled Report/,
      });
      fireEvent.click(scheduledCheckbox);

      // Enable email delivery and set email
      const emailCheckbox = screen.getByRole("checkbox", {
        name: /Email Delivery/,
      });
      fireEvent.click(emailCheckbox);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText("recipient@example.com");
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      });

      // Mock successful creation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: "new-report" } }),
      });

      const createButton = screen.getByText("Create Scheduled Report");
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/admin/reports/schedule",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
              "Content-Type": "application/json",
            }),
          })
        );
      });
    });

    it("should handle scheduled report creation errors", async () => {
      const { toast } = require("react-hot-toast");

      // Enable scheduled reporting
      const scheduledCheckbox = screen.getByRole("checkbox", {
        name: /Create Scheduled Report/,
      });
      fireEvent.click(scheduledCheckbox);

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Creation failed" }),
      });

      const createButton = screen.getByText("Create Scheduled Report");
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to create scheduled report"
        );
      });
    });
  });

  describe("Form Validation", () => {
    beforeEach(() => {
      renderComponent();
    });

    it("should handle form state changes", async () => {
      // Test report type change
      const reportTypeSelectors = screen.getAllByRole("combobox");
      if (reportTypeSelectors.length > 0) {
        fireEvent.click(reportTypeSelectors[0]);

        await waitFor(() => {
          const revenueOption = screen.getByText("Revenue Analytics");
          fireEvent.click(revenueOption);
        });
      }

      // Test format change
      const formatSelectors = screen.getAllByRole("combobox");
      const formatSelector = formatSelectors.find(
        (selector) =>
          selector.closest("div").previousElementSibling?.textContent ===
          "Export Format"
      );

      if (formatSelector) {
        fireEvent.click(formatSelector);

        await waitFor(() => {
          const pdfOption = screen.getByText("PDF");
          fireEvent.click(pdfOption);
        });
      }
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      renderComponent();
    });

    it("should have proper form labels", () => {
      expect(screen.getByText("Report Type")).toBeInTheDocument();
      expect(screen.getByText("Export Format")).toBeInTheDocument();
      expect(screen.getByText("Date Range")).toBeInTheDocument();
    });

    it("should have accessible checkboxes", () => {
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it("should have accessible buttons", () => {
      expect(
        screen.getByRole("button", { name: /Generate & Download Report/ })
      ).toBeInTheDocument();
    });

    it("should have proper tab navigation", () => {
      const tabList = screen.getByRole("tablist");
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(2);
    });
  });
});

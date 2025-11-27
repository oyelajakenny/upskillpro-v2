/**
 * PlatformSettingsTab Component Tests
 *
 * Tests for the PlatformSettingsTab component including:
 * - Form rendering and input handling
 * - Form validation
 * - Settings update functionality
 * - Error handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import PlatformSettingsTab from "../../../app/admin-dashboard/settings/components/PlatformSettingsTab";

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => "mock-token"),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("PlatformSettingsTab Component", () => {
  const mockSettings = {
    platformName: "UpSkillPro",
    maintenanceMode: false,
    allowUserRegistration: true,
    requireCourseApproval: true,
    maxFileUploadSize: 100,
    supportEmail: "support@upskillpro.com",
    defaultLanguage: "en",
    maintenanceMessage: "Platform is under maintenance",
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockOnUpdate.mockClear();
  });

  describe("Form Rendering", () => {
    it("should render all form fields with correct values", () => {
      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      expect(screen.getByDisplayValue("UpSkillPro")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("support@upskillpro.com")
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Platform is under maintenance")
      ).toBeInTheDocument();
    });

    it("should render toggle switches with correct states", () => {
      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const maintenanceToggle = screen.getByRole("switch", {
        name: /maintenance mode/i,
      });
      const registrationToggle = screen.getByRole("switch", {
        name: /allow user registration/i,
      });
      const approvalToggle = screen.getByRole("switch", {
        name: /require course approval/i,
      });

      expect(maintenanceToggle).not.toBeChecked();
      expect(registrationToggle).toBeChecked();
      expect(approvalToggle).toBeChecked();
    });

    it("should render language dropdown with correct selection", () => {
      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const languageSelect = screen.getByDisplayValue("en");
      expect(languageSelect).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("should update input values when user types", async () => {
      const user = userEvent.setup();
      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const platformNameInput = screen.getByDisplayValue("UpSkillPro");
      await user.clear(platformNameInput);
      await user.type(platformNameInput, "New Platform Name");

      expect(platformNameInput).toHaveValue("New Platform Name");
    });

    it("should toggle switches when clicked", async () => {
      const user = userEvent.setup();
      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const maintenanceToggle = screen.getByRole("switch", {
        name: /maintenance mode/i,
      });
      await user.click(maintenanceToggle);

      expect(maintenanceToggle).toBeChecked();
    });

    it("should update language selection", async () => {
      const user = userEvent.setup();
      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const languageSelect = screen.getByDisplayValue("en");
      await user.selectOptions(languageSelect, "es");

      expect(languageSelect).toHaveValue("es");
    });
  });

  describe("Form Submission", () => {
    it("should submit form with updated settings", async () => {
      const user = userEvent.setup();

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockSettings, platformName: "Updated Name" },
        }),
      });

      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const platformNameInput = screen.getByDisplayValue("UpSkillPro");
      await user.clear(platformNameInput);
      await user.type(platformNameInput, "Updated Name");

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/admin/settings/platform", {
          method: "PUT",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settings: expect.objectContaining({
              platformName: "Updated Name",
            }),
          }),
        });
      });

      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      fetch.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it("should show success message after successful update", async () => {
      const user = userEvent.setup();

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockSettings,
        }),
      });

      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Platform settings updated successfully!")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when API call fails", async () => {
      const user = userEvent.setup();

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: "Failed to update settings",
        }),
      });

      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to update settings")
        ).toBeInTheDocument();
      });
    });

    it("should display validation errors", async () => {
      const user = userEvent.setup();

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: "Invalid settings provided",
          errors: ["Platform name must be a string"],
        }),
      });

      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Invalid settings provided")
        ).toBeInTheDocument();
      });
    });

    it("should handle network errors", async () => {
      const user = userEvent.setup();

      fetch.mockRejectedValueOnce(new Error("Network error"));

      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("Maintenance Mode Warning", () => {
    it("should highlight maintenance mode card when enabled", async () => {
      const user = userEvent.setup();
      render(
        <PlatformSettingsTab settings={mockSettings} onUpdate={mockOnUpdate} />
      );

      const maintenanceToggle = screen.getByRole("switch", {
        name: /maintenance mode/i,
      });
      await user.click(maintenanceToggle);

      const maintenanceCard = maintenanceToggle.closest(
        '[class*="border-orange"]'
      );
      expect(maintenanceCard).toBeInTheDocument();
    });
  });

  describe("Default Values", () => {
    it("should use default values when settings are not provided", () => {
      render(<PlatformSettingsTab settings={null} onUpdate={mockOnUpdate} />);

      expect(screen.getByDisplayValue("UpSkillPro")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("support@upskillpro.com")
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    });
  });
});

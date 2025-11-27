/**
 * SecurityPoliciesTab Component Tests
 *
 * Tests for the SecurityPoliciesTab component including:
 * - Policy form rendering and input handling
 * - Policy validation
 * - Settings update functionality
 * - IP address management
 * - Error handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SecurityPoliciesTab from "../../../app/admin-dashboard/settings/components/SecurityPoliciesTab";

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

describe("SecurityPoliciesTab Component", () => {
  const mockPolicies = {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      maxAge: 90,
      preventReuse: 5,
    },
    sessionPolicy: {
      maxDuration: 24,
      idleTimeout: 2,
      requireMFA: false,
      allowConcurrentSessions: true,
      maxConcurrentSessions: 3,
    },
    accessControl: {
      enableIPWhitelist: false,
      allowedIPs: ["192.168.1.0/24"],
      enableRateLimit: true,
      maxRequestsPerMinute: 100,
      enableBruteForceProtection: true,
      maxFailedAttempts: 5,
      lockoutDuration: 30,
    },
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockOnUpdate.mockClear();
  });

  describe("Component Loading", () => {
    it("should show loading state initially", () => {
      fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<SecurityPoliciesTab onUpdate={mockOnUpdate} />);

      expect(
        screen.getByText("Loading security policies...")
      ).toBeInTheDocument();
    });

    it("should load and display security policies", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPolicies,
        }),
      });

      render(<SecurityPoliciesTab onUpdate={mockOnUpdate} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("8")).toBeInTheDocument(); // minLength
        expect(screen.getByDisplayValue("24")).toBeInTheDocument(); // maxDuration
        expect(screen.getByDisplayValue("100")).toBeInTheDocument(); // maxRequestsPerMinute
      });
    });

    it("should show error when loading fails", async () => {
      fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      render(<SecurityPoliciesTab onUpdate={mockOnUpdate} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
      });
    });
  });

  describe("Password Policy Form", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPolicies,
        }),
      });

      render(<SecurityPoliciesTab onUpdate={mockOnUpdate} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("8")).toBeInTheDocument();
      });
    });

    it("should render password policy fields with correct values", () => {
      expect(screen.getByDisplayValue("8")).toBeInTheDocument(); // minLength
      expect(screen.getByDisplayValue("90")).toBeInTheDocument(); // maxAge
      expect(screen.getByDisplayValue("5")).toBeInTheDocument(); // preventReuse
    });

    it("should render password requirement toggles", () => {
      const uppercaseToggle = screen.getByRole("switch", {
        name: /require uppercase letters/i,
      });
      const lowercaseToggle = screen.getByRole("switch", {
        name: /require lowercase letters/i,
      });
      const numbersToggle = screen.getByRole("switch", {
        name: /require numbers/i,
      });
      const specialCharsToggle = screen.getByRole("switch", {
        name: /require special characters/i,
      });

      expect(uppercaseToggle).toBeChecked();
      expect(lowercaseToggle).toBeChecked();
      expect(numbersToggle).toBeChecked();
      expect(specialCharsToggle).not.toBeChecked();
    });

    it("should update password policy values", async () => {
      const user = userEvent.setup();

      const minLengthInput = screen.getByDisplayValue("8");
      await user.clear(minLengthInput);
      await user.type(minLengthInput, "12");

      expect(minLengthInput).toHaveValue(12);
    });

    it("should toggle password requirements", async () => {
      const user = userEvent.setup();

      const specialCharsToggle = screen.getByRole("switch", {
        name: /require special characters/i,
      });
      await user.click(specialCharsToggle);

      expect(specialCharsToggle).toBeChecked();
    });
  });

  describe("Session Policy Form", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPolicies,
        }),
      });

      render(<SecurityPoliciesTab onUpdate={mockOnUpdate} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("24")).toBeInTheDocument();
      });
    });

    it("should render session policy fields", () => {
      expect(screen.getByDisplayValue("24")).toBeInTheDocument(); // maxDuration
      expect(screen.getByDisplayValue("2")).toBeInTheDocument(); // idleTimeout
      expect(screen.getByDisplayValue("3")).toBeInTheDocument(); // maxConcurrentSessions
    });

    it("should render session policy toggles", () => {
      const mfaToggle = screen.getByRole("switch", {
        name: /require multi-factor authentication/i,
      });
      const concurrentToggle = screen.getByRole("switch", {
        name: /allow concurrent sessions/i,
      });

      expect(mfaToggle).not.toBeChecked();
      expect(concurrentToggle).toBeChecked();
    });
  });

  describe("Access Control Form", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPolicies,
        }),
      });

      render(<SecurityPoliciesTab onUpdate={mockOnUpdate} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      });
    });

    it("should render access control fields", () => {
      expect(screen.getByDisplayValue("100")).toBeInTheDocument(); // maxRequestsPerMinute
      expect(screen.getByDisplayValue("5")).toBeInTheDocument(); // maxFailedAttempts
      expect(screen.getByDisplayValue("30")).toBeInTheDocument(); // lockoutDuration
    });

    it("should render access control toggles", () => {
      const ipWhitelistToggle = screen.getByRole("switch", {
        name: /enable ip whitelisting/i,
      });
      const rateLimitToggle = screen.getByRole("switch", {
        name: /enable rate limiting/i,
      });
      const bruteForceToggle = screen.getByRole("switch", {
        name: /enable brute force protection/i,
      });

      expect(ipWhitelistToggle).not.toBeChecked();
      expect(rateLimitToggle).toBeChecked();
      expect(bruteForceToggle).toBeChecked();
    });

    it("should show IP address fields when IP whitelisting is enabled", async () => {
      const user = userEvent.setup();

      const ipWhitelistToggle = screen.getByRole("switch", {
        name: /enable ip whitelisting/i,
      });
      await user.click(ipWhitelistToggle);

      await waitFor(() => {
        expect(screen.getByText("Allowed IP Addresses")).toBeInTheDocument();
        expect(screen.getByDisplayValue("192.168.1.0/24")).toBeInTheDocument();
      });
    });

    it("should add new IP address field", async () => {
      const user = userEvent.setup();

      const ipWhitelistToggle = screen.getByRole("switch", {
        name: /enable ip whitelisting/i,
      });
      await user.click(ipWhitelistToggle);

      await waitFor(() => {
        const addButton = screen.getByRole("button", {
          name: /add ip address/i,
        });
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByRole("button", { name: /add ip address/i });
      await user.click(addButton);

      const ipInputs = screen.getAllByPlaceholderText(
        /192.168.1.0\/24 or 10.0.0.1/
      );
      expect(ipInputs).toHaveLength(2);
    });

    it("should remove IP address field", async () => {
      const user = userEvent.setup();

      const ipWhitelistToggle = screen.getByRole("switch", {
        name: /enable ip whitelisting/i,
      });
      await user.click(ipWhitelistToggle);

      await waitFor(() => {
        const removeButton = screen.getByRole("button", { name: /remove/i });
        expect(removeButton).toBeInTheDocument();
      });

      const removeButton = screen.getByRole("button", { name: /remove/i });
      await user.click(removeButton);

      const ipInputs = screen.queryAllByPlaceholderText(
        /192.168.1.0\/24 or 10.0.0.1/
      );
      expect(ipInputs).toHaveLength(0);
    });
  });

  describe("Form Submission", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPolicies,
        }),
      });

      render(<SecurityPoliciesTab onUpdate={mockOnUpdate} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("8")).toBeInTheDocument();
      });

      fetch.mockClear();
    });

    it("should submit updated policies", async () => {
      const user = userEvent.setup();

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockPolicies, updatedAt: "2025-01-15T10:00:00Z" },
        }),
      });

      const minLengthInput = screen.getByDisplayValue("8");
      await user.clear(minLengthInput);
      await user.type(minLengthInput, "10");

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/admin/security/policies", {
          method: "PUT",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            policies: expect.objectContaining({
              passwordPolicy: expect.objectContaining({
                minLength: 10,
              }),
            }),
          }),
        });
      });

      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it("should show success message after successful update", async () => {
      const user = userEvent.setup();

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPolicies,
        }),
      });

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Security policies updated successfully!")
        ).toBeInTheDocument();
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      fetch.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPolicies,
        }),
      });

      render(<SecurityPoliciesTab onUpdate={mockOnUpdate} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("8")).toBeInTheDocument();
      });

      fetch.mockClear();
    });

    it("should display error message when update fails", async () => {
      const user = userEvent.setup();

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: "Failed to update security policies",
        }),
      });

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to update security policies")
        ).toBeInTheDocument();
      });
    });

    it("should display validation errors", async () => {
      const user = userEvent.setup();

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: "Invalid security policies provided",
          errors: [
            "Password minimum length must be between 6 and 50 characters",
          ],
        }),
      });

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Invalid security policies provided")
        ).toBeInTheDocument();
      });
    });
  });
});

/**
 * RoleManagementModal Component Tests
 *
 * Tests for the RoleManagementModal component including:
 * - Role selection and validation
 * - Role change confirmation
 * - Role history display
 * - API interactions
 * - Error handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";
import RoleManagementModal from "../../../app/admin-dashboard/users/components/RoleManagementModal";

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";

// Create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { token: "mock-token" }) => state,
    },
  });
};

// Mock user data
const mockUser = {
  userId: "user-1",
  name: "John Doe",
  email: "john.doe@example.com",
  role: "student",
  accountStatus: "active",
};

// Mock role history data
const mockRoleHistory = [
  {
    actionId: "1",
    action: "USER_ROLE_CHANGE",
    timestamp: "2024-01-15T10:00:00Z",
    adminId: "admin-1",
    details: {
      previousRole: "student",
      newRole: "instructor",
      reason: "Instructor application approved",
    },
  },
];

describe("RoleManagementModal Component", () => {
  let store;
  let mockOnClose;
  let mockOnRoleUpdate;

  beforeEach(() => {
    store = createMockStore();
    mockOnClose = jest.fn();
    mockOnRoleUpdate = jest.fn();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      user: mockUser,
      isOpen: true,
      onClose: mockOnClose,
      onRoleUpdate: mockOnRoleUpdate,
    };

    return render(
      <Provider store={store}>
        <RoleManagementModal {...defaultProps} {...props} />
      </Provider>
    );
  };

  describe("Modal Rendering", () => {
    it("should not render when isOpen is false", () => {
      renderComponent({ isOpen: false });
      expect(screen.queryByText("Role Management")).not.toBeInTheDocument();
    });

    it("should not render when user is null", () => {
      renderComponent({ user: null });
      expect(screen.queryByText("Role Management")).not.toBeInTheDocument();
    });

    it("should render modal when isOpen is true and user is provided", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      expect(screen.getByText("Role Management")).toBeInTheDocument();
      expect(
        screen.getByText("Manage role for John Doe (john.doe@example.com)")
      ).toBeInTheDocument();
    });

    it("should display current role correctly", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      expect(screen.getByText("Current Role")).toBeInTheDocument();
      expect(screen.getByText("Student")).toBeInTheDocument();
    });
  });

  describe("Role Selection", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });
    });

    it("should display all available roles", () => {
      expect(screen.getByText("Student")).toBeInTheDocument();
      expect(screen.getByText("Instructor")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Super Admin")).toBeInTheDocument();
    });

    it("should show current role as selected by default", () => {
      const studentRadio = screen.getByRole("radio", { name: "student" });
      expect(studentRadio).toBeChecked();
    });

    it("should allow selecting different roles", () => {
      const instructorRadio = screen.getByRole("radio", { name: "instructor" });
      fireEvent.click(instructorRadio);

      expect(instructorRadio).toBeChecked();
    });

    it("should show role descriptions and permissions", () => {
      expect(
        screen.getByText("Can enroll in courses and access learning materials")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Can create and manage courses, view student progress")
      ).toBeInTheDocument();
    });

    it("should highlight current role", () => {
      expect(screen.getByText("Current")).toBeInTheDocument();
    });
  });

  describe("Role Change Validation", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });
    });

    it("should show warning when role is changed", () => {
      const instructorRadio = screen.getByRole("radio", { name: "instructor" });
      fireEvent.click(instructorRadio);

      expect(screen.getByText("Role Change Warning")).toBeInTheDocument();
      expect(
        screen.getByText(/Changing the user's role will immediately affect/)
      ).toBeInTheDocument();
    });

    it("should enable change role button when different role is selected", () => {
      const instructorRadio = screen.getByRole("radio", { name: "instructor" });
      fireEvent.click(instructorRadio);

      const changeRoleButton = screen.getByRole("button", {
        name: "Change Role",
      });
      expect(changeRoleButton).toBeEnabled();
    });

    it("should not show change role button when same role is selected", () => {
      const changeRoleButton = screen.queryByRole("button", {
        name: "Change Role",
      });
      expect(changeRoleButton).not.toBeInTheDocument();
    });

    it("should allow entering reason for role change", () => {
      const reasonTextarea = screen.getByPlaceholderText(
        "Enter reason for role change..."
      );
      fireEvent.change(reasonTextarea, {
        target: { value: "Promotion to instructor" },
      });

      expect(reasonTextarea.value).toBe("Promotion to instructor");
    });
  });

  describe("Role Change Confirmation", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });

      // Select a different role
      const instructorRadio = screen.getByRole("radio", { name: "instructor" });
      fireEvent.click(instructorRadio);
    });

    it("should show confirmation dialog when change role is clicked", () => {
      const changeRoleButton = screen.getByRole("button", {
        name: "Change Role",
      });
      fireEvent.click(changeRoleButton);

      expect(screen.getByText("Confirm Role Change")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to change John Doe's role/)
      ).toBeInTheDocument();
    });

    it("should allow canceling role change", () => {
      const changeRoleButton = screen.getByRole("button", {
        name: "Change Role",
      });
      fireEvent.click(changeRoleButton);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(screen.queryByText("Confirm Role Change")).not.toBeInTheDocument();
    });

    it("should submit role change when confirmed", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const changeRoleButton = screen.getByRole("button", {
        name: "Change Role",
      });
      fireEvent.click(changeRoleButton);

      const confirmButton = screen.getByRole("button", {
        name: "Confirm Change",
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/admin/users/user-1/role"),
          expect.objectContaining({
            method: "PUT",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining("instructor"),
          })
        );
      });
    });

    it("should call onRoleUpdate when role change is successful", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const changeRoleButton = screen.getByRole("button", {
        name: "Change Role",
      });
      fireEvent.click(changeRoleButton);

      const confirmButton = screen.getByRole("button", {
        name: "Confirm Change",
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnRoleUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: "user-1",
            role: "instructor",
          })
        );
      });
    });

    it("should show loading state during role change", async () => {
      fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      );

      const changeRoleButton = screen.getByRole("button", {
        name: "Change Role",
      });
      fireEvent.click(changeRoleButton);

      const confirmButton = screen.getByRole("button", {
        name: "Confirm Change",
      });
      fireEvent.click(confirmButton);

      expect(screen.getByText("Changing...")).toBeInTheDocument();
    });
  });

  describe("Role History Display", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });
    });

    it("should display role change history", async () => {
      await waitFor(() => {
        expect(screen.getByText("Role Change History")).toBeInTheDocument();
        expect(screen.getByText("student")).toBeInTheDocument();
        expect(screen.getByText("instructor")).toBeInTheDocument();
        expect(
          screen.getByText("Instructor application approved")
        ).toBeInTheDocument();
      });
    });

    it("should show admin who made the change", async () => {
      await waitFor(() => {
        expect(screen.getByText("By: admin-1")).toBeInTheDocument();
      });
    });

    it("should display 'No role changes recorded' when history is empty", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: [] },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText("No role changes recorded")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Modal Interactions", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });
    });

    it("should call onClose when close button is clicked", () => {
      const closeButton = screen.getByRole("button", { name: "" }); // X button
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when Close button is clicked", () => {
      const closeButton = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should reset form when modal is closed and reopened", () => {
      // Select a different role
      const instructorRadio = screen.getByRole("radio", { name: "instructor" });
      fireEvent.click(instructorRadio);

      // Close modal
      const closeButton = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeButton);

      // Reopen modal
      renderComponent();

      // Should be back to original role
      const studentRadio = screen.getByRole("radio", { name: "student" });
      expect(studentRadio).toBeChecked();
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Server error" }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });

      // Should still render the modal despite API error
      expect(screen.getByText("Current Role")).toBeInTheDocument();
    });

    it("should handle network errors", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });

      // Should still render with fallback data
      expect(screen.getByText("Role Change History")).toBeInTheDocument();
    });

    it("should handle role change API errors", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });

      // Select different role and try to change
      const instructorRadio = screen.getByRole("radio", { name: "instructor" });
      fireEvent.click(instructorRadio);

      const changeRoleButton = screen.getByRole("button", {
        name: "Change Role",
      });
      fireEvent.click(changeRoleButton);

      // Mock API error for role change
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Role change failed" }),
      });

      const confirmButton = screen.getByRole("button", {
        name: "Confirm Change",
      });
      fireEvent.click(confirmButton);

      // Should handle error gracefully (no crash)
      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recentActions: mockRoleHistory },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Role Management")).toBeInTheDocument();
      });
    });

    it("should have proper radio button labels", () => {
      expect(
        screen.getByRole("radio", { name: "student" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: "instructor" })
      ).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "admin" })).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: "super_admin" })
      ).toBeInTheDocument();
    });

    it("should have accessible button labels", () => {
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("should have proper form labels", () => {
      expect(
        screen.getByLabelText("Reason for Role Change")
      ).toBeInTheDocument();
    });
  });
});

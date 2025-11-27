/**
 * UserProfileModal Component Tests
 *
 * Tests for the UserProfileModal component including:
 * - Modal rendering and display
 * - User information display
 * - Edit functionality
 * - Form validation
 * - API interactions
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";
import UserProfileModal from "../../../app/admin-dashboard/users/components/UserProfileModal";

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
  phone: "+1234567890",
  location: "New York, NY",
  createdAt: "2024-01-15T10:00:00Z",
  lastLoginAt: "2024-01-20T14:30:00Z",
  loginCount: 25,
  failedLoginAttempts: 2,
  profilePicture: null,
};

// Mock activity data
const mockActivityData = {
  loginCount: 25,
  lastLoginAt: "2024-01-20T14:30:00Z",
  failedLoginAttempts: 2,
  accountStatus: "active",
  recentActions: [
    {
      actionId: "1",
      action: "LOGIN",
      timestamp: "2024-01-20T14:30:00Z",
      details: { ipAddress: "192.168.1.100" },
    },
    {
      actionId: "2",
      action: "COURSE_ENROLLMENT",
      timestamp: "2024-01-19T10:00:00Z",
      details: { courseId: "course-123", courseTitle: "React Basics" },
    },
  ],
};

describe("UserProfileModal Component", () => {
  let store;
  let mockOnClose;
  let mockOnUserUpdate;

  beforeEach(() => {
    store = createMockStore();
    mockOnClose = jest.fn();
    mockOnUserUpdate = jest.fn();
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
      onUserUpdate: mockOnUserUpdate,
    };

    return render(
      <Provider store={store}>
        <UserProfileModal {...defaultProps} {...props} />
      </Provider>
    );
  };

  describe("Modal Rendering", () => {
    it("should not render when isOpen is false", () => {
      renderComponent({ isOpen: false });
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });

    it("should not render when user is null", () => {
      renderComponent({ user: null });
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });

    it("should render modal when isOpen is true and user is provided", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockActivityData }),
      });

      renderComponent();

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("User ID: user-1")).toBeInTheDocument();
    });

    it("should display user information correctly", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockActivityData }),
      });

      renderComponent();

      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("+1234567890")).toBeInTheDocument();
      expect(screen.getByText("New York, NY")).toBeInTheDocument();
      expect(screen.getByText("student")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockActivityData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should enter edit mode when edit button is clicked", () => {
      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      // Should show form inputs
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("john.doe@example.com")
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("+1234567890")).toBeInTheDocument();
    });

    it("should show save and cancel buttons in edit mode", () => {
      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      expect(screen.getByRole("button", { name: /Save/ })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Cancel/ })
      ).toBeInTheDocument();
    });

    it("should exit edit mode when cancel is clicked", () => {
      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      const cancelButton = screen.getByRole("button", { name: /Cancel/ });
      fireEvent.click(cancelButton);

      // Should show static text again
      expect(screen.queryByDisplayValue("John Doe")).not.toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should update form values when inputs change", () => {
      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "John Smith" } });

      expect(nameInput.value).toBe("John Smith");
    });
  });

  describe("Form Validation and Submission", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockActivityData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should save user changes when save button is clicked", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "John Smith" } });

      const saveButton = screen.getByRole("button", { name: /Save/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/admin/users/user-1"),
          expect.objectContaining({
            method: "PUT",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining("John Smith"),
          })
        );
      });
    });

    it("should call onUserUpdate when save is successful", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      const saveButton = screen.getByRole("button", { name: /Save/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: "user-1",
            name: "John Doe",
          })
        );
      });
    });

    it("should handle role changes separately", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      const roleSelect = screen.getByDisplayValue("student");
      fireEvent.change(roleSelect, { target: { value: "instructor" } });

      const saveButton = screen.getByRole("button", { name: /Save/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/admin/users/user-1/role"),
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining("instructor"),
          })
        );
      });
    });

    it("should handle status changes separately", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      const statusSelect = screen.getByDisplayValue("active");
      fireEvent.change(statusSelect, { target: { value: "suspended" } });

      const saveButton = screen.getByRole("button", { name: /Save/ });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/admin/users/user-1/status"),
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining("suspended"),
          })
        );
      });
    });
  });

  describe("Activity Summary Display", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockActivityData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should display activity summary metrics", async () => {
      await waitFor(() => {
        expect(screen.getByText("25")).toBeInTheDocument(); // Total Logins
        expect(screen.getByText("2")).toBeInTheDocument(); // Failed Attempts
      });
    });

    it("should display recent activity list", async () => {
      await waitFor(() => {
        expect(screen.getByText("LOGIN")).toBeInTheDocument();
        expect(screen.getByText("COURSE_ENROLLMENT")).toBeInTheDocument();
        expect(screen.getByText("Course: React Basics")).toBeInTheDocument();
      });
    });

    it("should handle missing activity data gracefully", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch" }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Should still render with mock data
      expect(screen.getByText("Total Logins")).toBeInTheDocument();
    });
  });

  describe("Modal Interactions", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockActivityData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should call onClose when close button is clicked", () => {
      const closeButton = screen.getByRole("button", { name: "" }); // X button
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should disable save button when loading", async () => {
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

      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      const saveButton = screen.getByRole("button", { name: /Save/ });
      fireEvent.click(saveButton);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
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
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Should still render the modal despite API error
      expect(screen.getByText("Basic Information")).toBeInTheDocument();
    });

    it("should handle network errors", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Should still render with fallback data
      expect(screen.getByText("Activity Summary")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockActivityData }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should have proper form labels", () => {
      const editButton = screen.getByRole("button", { name: /Edit/ });
      fireEvent.click(editButton);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Phone")).toBeInTheDocument();
      expect(screen.getByLabelText("Role")).toBeInTheDocument();
      expect(screen.getByLabelText("Account Status")).toBeInTheDocument();
    });

    it("should have accessible button labels", () => {
      expect(screen.getByRole("button", { name: /Edit/ })).toBeInTheDocument();
    });
  });
});

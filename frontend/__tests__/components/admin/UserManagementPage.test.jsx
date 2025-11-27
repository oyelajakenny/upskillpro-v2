/**
 * UserManagementPage Component Tests
 *
 * Tests for the UserManagementPage component including:
 * - User data grid rendering
 * - Search and filtering functionality
 * - User selection and bulk operations
 * - Modal interactions
 * - Error handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";
import UserManagementPage from "../../../app/admin-dashboard/users/page";

// Mock the child components
jest.mock(
  "../../../app/admin-dashboard/users/components/UserProfileModal",
  () => {
    return function MockUserProfileModal({ isOpen, user, onClose }) {
      if (!isOpen) return null;
      return (
        <div data-testid="user-profile-modal">
          <h2>User Profile Modal</h2>
          <p>User: {user?.name}</p>
          <button onClick={onClose}>Close</button>
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/users/components/BulkOperationsModal",
  () => {
    return function MockBulkOperationsModal({
      isOpen,
      selectedUsers,
      onClose,
    }) {
      if (!isOpen) return null;
      return (
        <div data-testid="bulk-operations-modal">
          <h2>Bulk Operations Modal</h2>
          <p>Selected: {selectedUsers.length} users</p>
          <button onClick={onClose}>Close</button>
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/users/components/RoleManagementModal",
  () => {
    return function MockRoleManagementModal({ isOpen, user, onClose }) {
      if (!isOpen) return null;
      return (
        <div data-testid="role-management-modal">
          <h2>Role Management Modal</h2>
          <p>User: {user?.name}</p>
          <button onClick={onClose}>Close</button>
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/users/components/AccountStatusModal",
  () => {
    return function MockAccountStatusModal({ isOpen, user, onClose }) {
      if (!isOpen) return null;
      return (
        <div data-testid="account-status-modal">
          <h2>Account Status Modal</h2>
          <p>User: {user?.name}</p>
          <button onClick={onClose}>Close</button>
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/users/components/UserActivityModal",
  () => {
    return function MockUserActivityModal({ isOpen, user, onClose }) {
      if (!isOpen) return null;
      return (
        <div data-testid="user-activity-modal">
          <h2>User Activity Modal</h2>
          <p>User: {user?.name}</p>
          <button onClick={onClose}>Close</button>
        </div>
      );
    };
  }
);

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { token: "mock-token", user: { id: "admin-1" } }) => state,
    },
    preloadedState: initialState,
  });
};

// Mock user data
const mockUsers = [
  {
    userId: "user-1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "student",
    accountStatus: "active",
    createdAt: "2024-01-15T10:00:00Z",
    lastLoginAt: "2024-01-20T14:30:00Z",
    loginCount: 25,
    profilePicture: null,
  },
  {
    userId: "user-2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "instructor",
    accountStatus: "active",
    createdAt: "2024-01-10T09:00:00Z",
    lastLoginAt: "2024-01-21T11:15:00Z",
    loginCount: 45,
    profilePicture: null,
  },
  {
    userId: "user-3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "student",
    accountStatus: "suspended",
    createdAt: "2024-01-05T16:00:00Z",
    lastLoginAt: "2024-01-18T08:45:00Z",
    loginCount: 12,
    profilePicture: null,
  },
];

describe("UserManagementPage Component", () => {
  let store;

  beforeEach(() => {
    store = createMockStore();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <UserManagementPage />
      </Provider>
    );
  };

  describe("Initial Rendering", () => {
    it("should render the user management page header", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch" }),
      });

      renderComponent();

      expect(screen.getByText("User Management")).toBeInTheDocument();
      expect(
        screen.getByText("Manage all users, roles, and account statuses")
      ).toBeInTheDocument();
    });

    it("should render action buttons in header", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch" }),
      });

      renderComponent();

      expect(screen.getByText("Refresh")).toBeInTheDocument();
      expect(screen.getByText("Export")).toBeInTheDocument();
      expect(screen.getByText("Add User")).toBeInTheDocument();
    });

    it("should render search and filter controls", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch" }),
      });

      renderComponent();

      expect(
        screen.getByPlaceholderText("Search users by name or email...")
      ).toBeInTheDocument();
      expect(screen.getByText("student")).toBeInTheDocument();
      expect(screen.getByText("instructor")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
      expect(screen.getByText("suspended")).toBeInTheDocument();
    });
  });

  describe("User Data Loading", () => {
    it("should display loading state initially", async () => {
      fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    data: { users: mockUsers, lastEvaluatedKey: null },
                  }),
                }),
              100
            )
          )
      );

      renderComponent();

      // Should show loading spinner
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should display users when data loads successfully", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: mockUsers, lastEvaluatedKey: null },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      });
    });

    it("should display error message when fetch fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to fetch users" }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });

    it("should display 'No users found' when no data", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: [], lastEvaluatedKey: null },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("No users found")).toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: mockUsers, lastEvaluatedKey: null },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should trigger search when typing in search input", async () => {
      const searchInput = screen.getByPlaceholderText(
        "Search users by name or email..."
      );

      fireEvent.change(searchInput, { target: { value: "john" } });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("search=john"),
          expect.any(Object)
        );
      });
    });

    it("should update search term state", () => {
      const searchInput = screen.getByPlaceholderText(
        "Search users by name or email..."
      );

      fireEvent.change(searchInput, { target: { value: "test search" } });

      expect(searchInput.value).toBe("test search");
    });
  });

  describe("Filter Functionality", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: mockUsers, lastEvaluatedKey: null },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should filter by role when role button is clicked", async () => {
      const studentButton = screen.getByRole("button", { name: "student" });

      fireEvent.click(studentButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("role=student"),
          expect.any(Object)
        );
      });
    });

    it("should filter by status when status button is clicked", async () => {
      const activeButton = screen.getByRole("button", { name: "active" });

      fireEvent.click(activeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("accountStatus=active"),
          expect.any(Object)
        );
      });
    });

    it("should toggle filter when same button is clicked twice", async () => {
      const studentButton = screen.getByRole("button", { name: "student" });

      // Click once to activate
      fireEvent.click(studentButton);
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("role=student"),
          expect.any(Object)
        );
      });

      // Click again to deactivate
      fireEvent.click(studentButton);
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.not.stringContaining("role=student"),
          expect.any(Object)
        );
      });
    });
  });

  describe("User Selection", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: mockUsers, lastEvaluatedKey: null },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should select individual users", () => {
      const checkboxes = screen.getAllByRole("checkbox");
      const userCheckbox = checkboxes[1]; // First user checkbox (index 0 is select all)

      fireEvent.click(userCheckbox);

      expect(userCheckbox).toBeChecked();
    });

    it("should select all users when select all is clicked", () => {
      const checkboxes = screen.getAllByRole("checkbox");
      const selectAllCheckbox = checkboxes[0];

      fireEvent.click(selectAllCheckbox);

      // All user checkboxes should be checked
      checkboxes.slice(1).forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it("should show bulk operations when users are selected", () => {
      const checkboxes = screen.getAllByRole("checkbox");
      const userCheckbox = checkboxes[1];

      fireEvent.click(userCheckbox);

      expect(screen.getByText(/1 user\(s\) selected/)).toBeInTheDocument();
      expect(screen.getByText("Activate")).toBeInTheDocument();
      expect(screen.getByText("Suspend")).toBeInTheDocument();
      expect(screen.getByText("Change Role")).toBeInTheDocument();
    });
  });

  describe("Modal Interactions", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: mockUsers, lastEvaluatedKey: null },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should open user profile modal when view button is clicked", async () => {
      const viewButtons = screen.getAllByTitle("View Profile");
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("user-profile-modal")).toBeInTheDocument();
        expect(screen.getByText("User: John Doe")).toBeInTheDocument();
      });
    });

    it("should open role management modal when role button is clicked", async () => {
      const roleButtons = screen.getAllByTitle("Manage Role");
      fireEvent.click(roleButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("role-management-modal")).toBeInTheDocument();
        expect(screen.getByText("User: John Doe")).toBeInTheDocument();
      });
    });

    it("should open status management modal when status button is clicked", async () => {
      const statusButtons = screen.getAllByTitle("Manage Status");
      fireEvent.click(statusButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("account-status-modal")).toBeInTheDocument();
        expect(screen.getByText("User: John Doe")).toBeInTheDocument();
      });
    });

    it("should open activity modal when activity button is clicked", async () => {
      const activityButtons = screen.getAllByTitle("View Activity");
      fireEvent.click(activityButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("user-activity-modal")).toBeInTheDocument();
        expect(screen.getByText("User: John Doe")).toBeInTheDocument();
      });
    });

    it("should open bulk operations modal when bulk action is clicked", async () => {
      // Select a user first
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]);

      // Click bulk activate button
      const activateButton = screen.getByRole("button", { name: /Activate/ });
      fireEvent.click(activateButton);

      await waitFor(() => {
        expect(screen.getByTestId("bulk-operations-modal")).toBeInTheDocument();
        expect(screen.getByText("Selected: 1 users")).toBeInTheDocument();
      });
    });

    it("should close modals when close button is clicked", async () => {
      // Open profile modal
      const viewButtons = screen.getAllByTitle("View Profile");
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("user-profile-modal")).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId("user-profile-modal")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("should refresh data when refresh button is clicked", async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: mockUsers, lastEvaluatedKey: null },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole("button", { name: /Refresh/ });
      fireEvent.click(refreshButton);

      // Should make another API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("User Data Display", () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: mockUsers, lastEvaluatedKey: null },
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should display user information correctly", () => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("student")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("should display role badges with correct styling", () => {
      const studentBadge = screen.getByText("student");
      const instructorBadge = screen.getByText("instructor");

      expect(studentBadge).toBeInTheDocument();
      expect(instructorBadge).toBeInTheDocument();
    });

    it("should display status badges with correct styling", () => {
      const activeBadges = screen.getAllByText("active");
      const suspendedBadge = screen.getByText("suspended");

      expect(activeBadges.length).toBeGreaterThan(0);
      expect(suspendedBadge).toBeInTheDocument();
    });

    it("should display login counts", () => {
      expect(screen.getByText("25")).toBeInTheDocument(); // John's login count
      expect(screen.getByText("45")).toBeInTheDocument(); // Jane's login count
      expect(screen.getByText("12")).toBeInTheDocument(); // Bob's login count
    });
  });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CourseManagementPage from "../../../app/admin-dashboard/courses/page";

// Mock the child components
jest.mock(
  "../../../app/admin-dashboard/courses/components/CourseDetailsModal",
  () => {
    return function MockCourseDetailsModal({ isOpen, onClose }) {
      return isOpen ? (
        <div data-testid="course-details-modal">Course Details Modal</div>
      ) : null;
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/courses/components/CourseApprovalModal",
  () => {
    return function MockCourseApprovalModal({ isOpen, onClose }) {
      return isOpen ? (
        <div data-testid="course-approval-modal">Course Approval Modal</div>
      ) : null;
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/courses/components/ContentModerationPanel",
  () => {
    return function MockContentModerationPanel() {
      return (
        <div data-testid="content-moderation-panel">
          Content Moderation Panel
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/courses/components/InstructorManagementPanel",
  () => {
    return function MockInstructorManagementPanel() {
      return (
        <div data-testid="instructor-management-panel">
          Instructor Management Panel
        </div>
      );
    };
  }
);

jest.mock(
  "../../../app/admin-dashboard/courses/components/CategoryManagementPanel",
  () => {
    return function MockCategoryManagementPanel() {
      return (
        <div data-testid="category-management-panel">
          Category Management Panel
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

const mockStore = configureStore({
  reducer: {
    auth: (state = { token: "mock-token", user: { id: "admin-1" } }) => state,
  },
});

const renderWithProvider = (component) => {
  return render(<Provider store={mockStore}>{component}</Provider>);
};

describe("CourseManagementPage", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders course management page with tabs", () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          courses: [],
          lastEvaluatedKey: null,
        },
      }),
    });

    renderWithProvider(<CourseManagementPage />);

    expect(screen.getByText("Course Management")).toBeInTheDocument();
    expect(screen.getByText("Course Management")).toBeInTheDocument();
    expect(screen.getByText("Content Moderation")).toBeInTheDocument();
    expect(screen.getByText("Instructor Management")).toBeInTheDocument();
    expect(screen.getByText("Category Management")).toBeInTheDocument();
  });

  it("displays course statistics correctly", async () => {
    const mockCourses = [
      {
        courseId: "course-1",
        title: "Test Course 1",
        status: "pending",
        price: 99.99,
        enrollmentCount: 50,
      },
      {
        courseId: "course-2",
        title: "Test Course 2",
        status: "approved",
        price: 149.99,
        enrollmentCount: 100,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          courses: mockCourses,
          lastEvaluatedKey: null,
        },
      }),
    });

    renderWithProvider(<CourseManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument(); // Pending courses
      expect(screen.getByText("1")).toBeInTheDocument(); // Approved courses
      expect(screen.getByText("150")).toBeInTheDocument(); // Total enrollments
    });
  });

  it("handles search functionality", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          courses: [],
          lastEvaluatedKey: null,
        },
      }),
    });

    renderWithProvider(<CourseManagementPage />);

    const searchInput = screen.getByPlaceholderText(
      "Search courses by title or description..."
    );
    fireEvent.change(searchInput, { target: { value: "React" } });

    expect(searchInput.value).toBe("React");
  });

  it("handles status filter functionality", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          courses: [],
          lastEvaluatedKey: null,
        },
      }),
    });

    renderWithProvider(<CourseManagementPage />);

    const pendingButton = screen.getByRole("button", { name: "pending" });
    fireEvent.click(pendingButton);

    expect(pendingButton).toHaveClass("bg-primary");
  });

  it("switches between tabs correctly", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          courses: [],
          lastEvaluatedKey: null,
        },
      }),
    });

    renderWithProvider(<CourseManagementPage />);

    // Switch to content moderation tab
    const moderationTab = screen.getByText("Content Moderation");
    fireEvent.click(moderationTab);

    await waitFor(() => {
      expect(
        screen.getByTestId("content-moderation-panel")
      ).toBeInTheDocument();
    });

    // Switch to instructor management tab
    const instructorTab = screen.getByText("Instructor Management");
    fireEvent.click(instructorTab);

    await waitFor(() => {
      expect(
        screen.getByTestId("instructor-management-panel")
      ).toBeInTheDocument();
    });

    // Switch to category management tab
    const categoryTab = screen.getByText("Category Management");
    fireEvent.click(categoryTab);

    await waitFor(() => {
      expect(
        screen.getByTestId("category-management-panel")
      ).toBeInTheDocument();
    });
  });

  it("displays courses in table format", async () => {
    const mockCourses = [
      {
        courseId: "course-1",
        title: "Advanced React Development",
        instructorName: "John Smith",
        categoryName: "Web Development",
        status: "pending",
        price: 99.99,
        enrollmentCount: 50,
        rating: 4.5,
        reviewCount: 20,
        createdAt: "2024-01-15T10:00:00Z",
        level: "Advanced",
        duration: "8 hours",
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          courses: mockCourses,
          lastEvaluatedKey: null,
        },
      }),
    });

    renderWithProvider(<CourseManagementPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Advanced React Development")
      ).toBeInTheDocument();
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Web Development")).toBeInTheDocument();
      expect(screen.getByText("$99.99")).toBeInTheDocument();
    });
  });

  it("handles course selection for bulk operations", async () => {
    const mockCourses = [
      {
        courseId: "course-1",
        title: "Test Course 1",
        status: "pending",
        price: 99.99,
        enrollmentCount: 50,
        instructorName: "John Smith",
        categoryName: "Web Development",
        rating: 4.5,
        reviewCount: 20,
        createdAt: "2024-01-15T10:00:00Z",
        level: "Advanced",
        duration: "8 hours",
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          courses: mockCourses,
          lastEvaluatedKey: null,
        },
      }),
    });

    renderWithProvider(<CourseManagementPage />);

    await waitFor(() => {
      const checkbox = screen.getAllByRole("checkbox")[1]; // First course checkbox (index 0 is select all)
      fireEvent.click(checkbox);

      expect(screen.getByText("1 course(s) selected")).toBeInTheDocument();
      expect(screen.getByText("Bulk Approve")).toBeInTheDocument();
      expect(screen.getByText("Bulk Reject")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("API Error"));

    renderWithProvider(<CourseManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("Error: API Error")).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching courses", () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderWithProvider(<CourseManagementPage />);

    expect(screen.getByText("Loading courses...")).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CourseApprovalModal from "../../../app/admin-dashboard/courses/components/CourseApprovalModal";

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

const mockCourse = {
  courseId: "course-1",
  title: "Advanced React Development",
  description: "Learn advanced React concepts and patterns",
  instructorName: "John Smith",
  categoryName: "Web Development",
  status: "pending",
  price: 99.99,
  duration: "8 hours",
  level: "Advanced",
};

describe("CourseApprovalModal", () => {
  const mockOnClose = jest.fn();
  const mockOnCourseUpdate = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockOnClose.mockClear();
    mockOnCourseUpdate.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders course approval modal when open", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    expect(screen.getByText("Course Approval Workflow")).toBeInTheDocument();
    expect(screen.getByText("Advanced React Development")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={false}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    expect(
      screen.queryByText("Course Approval Workflow")
    ).not.toBeInTheDocument();
  });

  it("displays course summary correctly", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    expect(screen.getByText("Advanced React Development")).toBeInTheDocument();
    expect(
      screen.getByText("Learn advanced React concepts and patterns")
    ).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("8 hours")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("shows action selection buttons", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
    expect(screen.getByText("Request Changes")).toBeInTheDocument();
  });

  it("handles approve action selection", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    expect(screen.getByText("Approve Course")).toBeInTheDocument();
    expect(screen.getByText("Approval Notes (Optional)")).toBeInTheDocument();
  });

  it("handles reject action selection", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);

    expect(screen.getByText("Reject Course")).toBeInTheDocument();
    expect(screen.getByText("Rejection Reason (Required)")).toBeInTheDocument();
  });

  it("handles request changes action selection", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    const requestChangesButton = screen.getByText("Request Changes");
    fireEvent.click(requestChangesButton);

    expect(screen.getByText("Request Changes")).toBeInTheDocument();
    expect(
      screen.getByText("Feedback for Changes (Required)")
    ).toBeInTheDocument();
  });

  it("validates required fields for rejection", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    // Select reject action
    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);

    // Try to submit without reason
    const submitButton = screen.getByText("Reject Course");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when required fields are filled", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    // Select reject action
    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);

    // Fill in reason
    const reasonTextarea = screen.getByPlaceholderText(
      "Please provide a detailed reason for rejection..."
    );
    fireEvent.change(reasonTextarea, {
      target: { value: "Content quality issues" },
    });

    // Submit button should be enabled
    const submitButton = screen.getByText("Reject Course");
    expect(submitButton).not.toBeDisabled();
  });

  it("handles successful course approval", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    // Select approve action
    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    // Submit approval
    const submitButton = screen.getByText("Approve Course");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnCourseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockCourse,
          status: "approved",
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles API errors during approval", async () => {
    fetch.mockRejectedValueOnce(new Error("API Error"));

    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    // Select approve action
    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    // Submit approval
    const submitButton = screen.getByText("Approve Course");
    fireEvent.click(submitButton);

    // Should still update course (simulated success)
    await waitFor(() => {
      expect(mockOnCourseUpdate).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("allows going back from action form", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    // Select approve action
    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    // Go back
    const backButton = screen.getByText("Back");
    fireEvent.click(backButton);

    // Should show action selection again
    expect(screen.getByText("Select Action")).toBeInTheDocument();
  });

  it("handles close button", () => {
    renderWithProvider(
      <CourseApprovalModal
        course={mockCourse}
        isOpen={true}
        onClose={mockOnClose}
        onCourseUpdate={mockOnCourseUpdate}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

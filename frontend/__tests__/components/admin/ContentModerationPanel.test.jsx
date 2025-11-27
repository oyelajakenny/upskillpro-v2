import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ContentModerationPanel from "../../../app/admin-dashboard/courses/components/ContentModerationPanel";

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

const mockFlaggedContent = [
  {
    id: "flag-1",
    contentType: "course",
    contentId: "course-1",
    contentTitle: "Advanced React Development",
    instructorName: "John Smith",
    flagReason: "Inappropriate content reported",
    flaggedBy: "user-123",
    flaggedAt: "2024-01-20T10:00:00Z",
    status: "pending",
    priority: "high",
    description: "User reported inappropriate language in video content",
  },
  {
    id: "flag-2",
    contentType: "review",
    contentId: "review-456",
    contentTitle: "Course Review - Python Basics",
    courseTitle: "Python for Data Science",
    flagReason: "Spam content",
    flaggedBy: "user-789",
    flaggedAt: "2024-01-19T15:30:00Z",
    status: "pending",
    priority: "medium",
    description: "Review contains promotional links and spam content",
  },
];

describe("ContentModerationPanel", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders content moderation panel", () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: [],
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    expect(screen.getByText("Content Moderation")).toBeInTheDocument();
    expect(
      screen.getByText("Review and moderate flagged content")
    ).toBeInTheDocument();
  });

  it("displays flagged content statistics", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // Pending count
      expect(screen.getByText("1")).toBeInTheDocument(); // High priority count
      expect(screen.getByText("2")).toBeInTheDocument(); // Total flags count
    });
  });

  it("displays flagged content in table format", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Advanced React Development")
      ).toBeInTheDocument();
      expect(screen.getByText("by John Smith")).toBeInTheDocument();
      expect(
        screen.getByText("Inappropriate content reported")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Course Review - Python Basics")
      ).toBeInTheDocument();
      expect(screen.getByText("Spam content")).toBeInTheDocument();
    });
  });

  it("shows correct priority badges", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText("high")).toBeInTheDocument();
      expect(screen.getByText("medium")).toBeInTheDocument();
    });
  });

  it("shows correct status badges", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      const pendingBadges = screen.getAllByText("pending");
      expect(pendingBadges).toHaveLength(2);
    });
  });

  it("handles view content details", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      const viewButtons = screen.getAllByTitle("View Details");
      expect(viewButtons).toHaveLength(2);
    });
  });

  it("handles approve content action", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      const approveButtons = screen.getAllByTitle("Approve Content");
      fireEvent.click(approveButtons[0]);

      expect(screen.getByText("Approve Content")).toBeInTheDocument();
      expect(
        screen.getByText("Content: Advanced React Development")
      ).toBeInTheDocument();
    });
  });

  it("handles remove content action", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      const removeButtons = screen.getAllByTitle("Remove Content");
      fireEvent.click(removeButtons[0]);

      expect(screen.getByText("Remove Content")).toBeInTheDocument();
      expect(
        screen.getByText("Content: Advanced React Development")
      ).toBeInTheDocument();
    });
  });

  it("validates moderation reason input", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      const approveButtons = screen.getAllByTitle("Approve Content");
      fireEvent.click(approveButtons[0]);

      const submitButton = screen.getByText("Approve");
      expect(submitButton).toBeDisabled();

      // Fill in reason
      const reasonTextarea = screen.getByPlaceholderText(
        "Add notes about why this content is approved..."
      );
      fireEvent.change(reasonTextarea, {
        target: { value: "Content is appropriate" },
      });

      expect(submitButton).not.toBeDisabled();
    });
  });

  it("handles successful moderation action", async () => {
    // Mock initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    // Mock moderation API call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      const approveButtons = screen.getAllByTitle("Approve Content");
      fireEvent.click(approveButtons[0]);

      // Fill in reason
      const reasonTextarea = screen.getByPlaceholderText(
        "Add notes about why this content is approved..."
      );
      fireEvent.change(reasonTextarea, {
        target: { value: "Content is appropriate" },
      });

      // Submit
      const submitButton = screen.getByText("Approve");
      fireEvent.click(submitButton);
    });

    // Should close modal after successful action
    await waitFor(() => {
      expect(screen.queryByText("Approve Content")).not.toBeInTheDocument();
    });
  });

  it("handles API errors during moderation", async () => {
    // Mock initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: mockFlaggedContent,
        },
      }),
    });

    // Mock failed moderation API call
    fetch.mockRejectedValueOnce(new Error("API Error"));

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      const approveButtons = screen.getAllByTitle("Approve Content");
      fireEvent.click(approveButtons[0]);

      // Fill in reason
      const reasonTextarea = screen.getByPlaceholderText(
        "Add notes about why this content is approved..."
      );
      fireEvent.change(reasonTextarea, {
        target: { value: "Content is appropriate" },
      });

      // Submit
      const submitButton = screen.getByText("Approve");
      fireEvent.click(submitButton);
    });

    // Should still close modal (simulated success)
    await waitFor(() => {
      expect(screen.queryByText("Approve Content")).not.toBeInTheDocument();
    });
  });

  it("handles refresh functionality", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: [],
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(fetch).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it("shows loading state", () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderWithProvider(<ContentModerationPanel />);

    expect(screen.getByText("Loading flagged content...")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("API Error"));

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText("Error: API Error")).toBeInTheDocument();
    });
  });

  it("shows empty state when no flagged content", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          flaggedContent: [],
        },
      }),
    });

    renderWithProvider(<ContentModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText("No flagged content found")).toBeInTheDocument();
    });
  });
});

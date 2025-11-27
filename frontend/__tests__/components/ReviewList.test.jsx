/**
 * ReviewList Component Tests
 *
 * Tests for the ReviewList component including:
 * - Review list rendering
 * - Pagination controls
 * - Loading and error states
 * - Empty state handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReviewList from "../../components/ReviewList";

describe("ReviewList Component", () => {
  const mockFetchReviews = jest.fn();
  const testCourseId = "course-123";

  const mockReviews = [
    {
      userId: "user-1",
      userName: "John Doe",
      rating: 5,
      review: "Excellent course!",
      createdAt: "2025-11-10T10:00:00Z",
      updatedAt: "2025-11-10T10:00:00Z",
    },
    {
      userId: "user-2",
      userName: "Jane Smith",
      rating: 4,
      review: "Very good content",
      createdAt: "2025-11-09T10:00:00Z",
      updatedAt: "2025-11-09T10:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Review List Rendering", () => {
    it("should render reviews when data is loaded", async () => {
      mockFetchReviews.mockResolvedValueOnce({
        ratings: mockReviews,
        hasMore: false,
      });

      render(
        <ReviewList
          courseId={testCourseId}
          fetchReviews={mockFetchReviews}
          pageSize={10}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Excellent course!")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });

    it("should display review count", async () => {
      mockFetchReviews.mockResolvedValueOnce({
        ratings: mockReviews,
        hasMore: false,
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Reviews \(2\)/i)).toBeInTheDocument();
      });
    });

    it("should render star ratings for each review", async () => {
      mockFetchReviews.mockResolvedValueOnce({
        ratings: mockReviews,
        hasMore: false,
      });

      const { container } = render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        const stars = container.querySelectorAll("svg");
        expect(stars.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Pagination", () => {
    it("should show pagination controls when there are more pages", async () => {
      mockFetchReviews.mockResolvedValueOnce({
        ratings: mockReviews,
        hasMore: true,
        lastEvaluatedKey: "next-key",
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText("Next")).toBeInTheDocument();
        expect(screen.getByText("Previous")).toBeInTheDocument();
      });
    });

    it("should disable Previous button on first page", async () => {
      mockFetchReviews.mockResolvedValueOnce({
        ratings: mockReviews,
        hasMore: true,
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        const prevButton = screen.getByText("Previous").closest("button");
        expect(prevButton).toBeDisabled();
      });
    });

    it("should disable Next button when no more pages", async () => {
      mockFetchReviews.mockResolvedValueOnce({
        ratings: mockReviews,
        hasMore: false,
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        const nextButton = screen.getByText("Next").closest("button");
        expect(nextButton).toBeDisabled();
      });
    });

    it("should fetch next page when Next is clicked", async () => {
      mockFetchReviews
        .mockResolvedValueOnce({
          ratings: mockReviews,
          hasMore: true,
          lastEvaluatedKey: "next-key",
        })
        .mockResolvedValueOnce({
          ratings: [mockReviews[0]],
          hasMore: false,
        });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText("Next")).toBeInTheDocument();
      });

      const nextButton = screen.getByText("Next").closest("button");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockFetchReviews).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator while fetching", () => {
      mockFetchReviews.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      expect(screen.getByText(/Loading reviews/i)).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message on fetch failure", async () => {
      mockFetchReviews.mockRejectedValueOnce({
        code: "NETWORK_ERROR",
        message: "Network error",
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load reviews/i)).toBeInTheDocument();
      });
    });

    it("should show retry button on error", async () => {
      mockFetchReviews.mockRejectedValueOnce({
        message: "Error loading",
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });
    });

    it("should retry fetching when retry button is clicked", async () => {
      mockFetchReviews
        .mockRejectedValueOnce({ message: "Error" })
        .mockResolvedValueOnce({
          ratings: mockReviews,
          hasMore: false,
        });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });

      const retryButton = screen.getByText("Try Again");
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no reviews", async () => {
      mockFetchReviews.mockResolvedValueOnce({
        ratings: [],
        hasMore: false,
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText("No reviews yet")).toBeInTheDocument();
      });
    });

    it("should show encouragement message in empty state", async () => {
      mockFetchReviews.mockResolvedValueOnce({
        ratings: [],
        hasMore: false,
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Be the first to share/i)).toBeInTheDocument();
      });
    });
  });

  describe("Date Formatting", () => {
    it("should format recent dates as relative time", async () => {
      const today = new Date().toISOString();
      mockFetchReviews.mockResolvedValueOnce({
        ratings: [
          {
            ...mockReviews[0],
            createdAt: today,
          },
        ],
        hasMore: false,
      });

      render(
        <ReviewList courseId={testCourseId} fetchReviews={mockFetchReviews} />
      );

      await waitFor(() => {
        expect(screen.getByText("Today")).toBeInTheDocument();
      });
    });
  });
});

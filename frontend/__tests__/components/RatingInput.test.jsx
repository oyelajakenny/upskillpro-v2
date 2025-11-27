/**
 * RatingInput Component Tests
 *
 * Tests for the RatingInput component including:
 * - Star rating interactions
 * - Form validation
 * - Review text input
 * - Submission handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RatingInput from "../../components/RatingInput";

describe("RatingInput Component", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Star Rating Interactions", () => {
    it("should render 5 stars", () => {
      render(<RatingInput onSubmit={mockOnSubmit} />);
      const stars = screen.getAllByLabelText(/Rate \d stars/);
      expect(stars).toHaveLength(5);
    });

    it("should update rating when star is clicked", () => {
      render(<RatingInput onSubmit={mockOnSubmit} />);
      const star3 = screen.getByLabelText("Rate 3 stars");

      fireEvent.click(star3);

      expect(screen.getByText("3 stars")).toBeInTheDocument();
    });

    it("should display initial rating", () => {
      render(<RatingInput initialRating={4} onSubmit={mockOnSubmit} />);
      expect(screen.getByText("4 stars")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when submitting without rating", async () => {
      render(<RatingInput onSubmit={mockOnSubmit} />);
      const submitButton = screen.getByRole("button", {
        name: /Submit Rating/i,
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Please select a rating")).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error when review exceeds 1000 characters", async () => {
      render(<RatingInput onSubmit={mockOnSubmit} />);
      const star5 = screen.getByLabelText("Rate 5 stars");
      const reviewInput = screen.getByPlaceholderText(/Share your experience/i);

      fireEvent.click(star5);
      fireEvent.change(reviewInput, { target: { value: "a".repeat(1001) } });

      await waitFor(() => {
        expect(
          screen.getByText(/must not exceed 1000 characters/i)
        ).toBeInTheDocument();
      });
    });

    it("should show character count", () => {
      render(<RatingInput onSubmit={mockOnSubmit} />);
      const reviewInput = screen.getByPlaceholderText(/Share your experience/i);

      fireEvent.change(reviewInput, { target: { value: "Great course!" } });

      expect(screen.getByText(/987 characters remaining/i)).toBeInTheDocument();
    });
  });

  describe("Review Text Input", () => {
    it("should update review text", () => {
      render(<RatingInput onSubmit={mockOnSubmit} />);
      const reviewInput = screen.getByPlaceholderText(/Share your experience/i);

      fireEvent.change(reviewInput, { target: { value: "Excellent course!" } });

      expect(reviewInput.value).toBe("Excellent course!");
    });

    it("should display initial review", () => {
      render(
        <RatingInput initialReview="Initial review" onSubmit={mockOnSubmit} />
      );
      const reviewInput = screen.getByPlaceholderText(/Share your experience/i);

      expect(reviewInput.value).toBe("Initial review");
    });
  });

  describe("Form Submission", () => {
    it("should submit valid rating and review", async () => {
      mockOnSubmit.mockResolvedValueOnce();
      render(<RatingInput onSubmit={mockOnSubmit} />);

      const star4 = screen.getByLabelText("Rate 4 stars");
      const reviewInput = screen.getByPlaceholderText(/Share your experience/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Rating/i,
      });

      fireEvent.click(star4);
      fireEvent.change(reviewInput, { target: { value: "Good course" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(4, "Good course");
      });
    });

    it("should show loading state during submission", async () => {
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      render(<RatingInput onSubmit={mockOnSubmit} />);

      const star5 = screen.getByLabelText("Rate 5 stars");
      const submitButton = screen.getByRole("button", {
        name: /Submit Rating/i,
      });

      fireEvent.click(star5);
      fireEvent.click(submitButton);

      expect(screen.getByText(/Submitting/i)).toBeInTheDocument();
    });

    it("should display error message on submission failure", async () => {
      mockOnSubmit.mockRejectedValueOnce({ code: "NOT_ENROLLED" });
      render(<RatingInput onSubmit={mockOnSubmit} />);

      const star5 = screen.getByLabelText("Rate 5 stars");
      const submitButton = screen.getByRole("button", {
        name: /Submit Rating/i,
      });

      fireEvent.click(star5);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be enrolled/i)).toBeInTheDocument();
      });
    });
  });

  describe("Disabled State", () => {
    it("should disable interactions when disabled prop is true", () => {
      render(<RatingInput disabled={true} onSubmit={mockOnSubmit} />);

      const star3 = screen.getByLabelText("Rate 3 stars");
      const submitButton = screen.getByRole("button", {
        name: /Submit Rating/i,
      });

      expect(star3).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});

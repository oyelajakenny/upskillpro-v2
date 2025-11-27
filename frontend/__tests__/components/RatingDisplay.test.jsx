/**
 * RatingDisplay Component Tests
 *
 * Tests for the RatingDisplay component including:
 * - Star rendering based on rating
 * - Rating count display
 * - Different size variants
 * - Zero ratings handling
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RatingDisplay from "../../components/RatingDisplay";

describe("RatingDisplay Component", () => {
  describe("Star Rendering", () => {
    it("should render 5 stars", () => {
      const { container } = render(
        <RatingDisplay averageRating={3} ratingCount={10} />
      );
      const stars = container.querySelectorAll("svg");
      expect(stars).toHaveLength(5);
    });

    it("should display correct average rating", () => {
      render(<RatingDisplay averageRating={4.3} ratingCount={25} />);
      expect(screen.getByText("4.3")).toBeInTheDocument();
    });

    it("should display rating count", () => {
      render(<RatingDisplay averageRating={4.5} ratingCount={100} />);
      expect(screen.getByText(/100 ratings/i)).toBeInTheDocument();
    });

    it("should display singular 'rating' for count of 1", () => {
      render(<RatingDisplay averageRating={5} ratingCount={1} />);
      expect(screen.getByText(/1 rating/i)).toBeInTheDocument();
    });
  });

  describe("Zero Ratings", () => {
    it("should display 'No ratings yet' when count is 0", () => {
      render(<RatingDisplay averageRating={0} ratingCount={0} />);
      expect(screen.getByText("No ratings yet")).toBeInTheDocument();
    });

    it("should render empty stars when no ratings", () => {
      const { container } = render(
        <RatingDisplay averageRating={0} ratingCount={0} />
      );
      const stars = container.querySelectorAll("svg");
      expect(stars).toHaveLength(5);
    });
  });

  describe("Size Variants", () => {
    it("should render with small size", () => {
      const { container } = render(
        <RatingDisplay averageRating={4} ratingCount={10} size="small" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render with medium size (default)", () => {
      const { container } = render(
        <RatingDisplay averageRating={4} ratingCount={10} size="medium" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render with large size", () => {
      const { container } = render(
        <RatingDisplay averageRating={4} ratingCount={10} size="large" />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Rating Values", () => {
    it("should handle whole number ratings", () => {
      render(<RatingDisplay averageRating={4} ratingCount={10} />);
      expect(screen.getByText("4.0")).toBeInTheDocument();
    });

    it("should handle decimal ratings", () => {
      render(<RatingDisplay averageRating={4.7} ratingCount={15} />);
      expect(screen.getByText("4.7")).toBeInTheDocument();
    });

    it("should round to one decimal place", () => {
      render(<RatingDisplay averageRating={4.666} ratingCount={20} />);
      expect(screen.getByText("4.7")).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <RatingDisplay
          averageRating={4}
          ratingCount={10}
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});

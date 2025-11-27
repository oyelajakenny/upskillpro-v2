/**
 * CategoryFilter Component Tests
 *
 * Note: These tests require a testing framework to be set up.
 * Install dependencies: npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
 *
 * To run tests: npm test
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryFilter from "../CategoryFilter";

describe("CategoryFilter Component", () => {
  const mockCategories = [
    { categoryId: "1", name: "Web Development" },
    { categoryId: "2", name: "Data Science" },
    { categoryId: "3", name: "Design" },
  ];

  const mockOnCategorySelect = jest.fn();
  const mockOnClearFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Category Rendering", () => {
    test("renders all categories correctly", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      // Check if all categories are rendered
      expect(screen.getByText("Web Development")).toBeInTheDocument();
      expect(screen.getByText("Data Science")).toBeInTheDocument();
      expect(screen.getByText("Design")).toBeInTheDocument();
    });

    test("renders 'All Courses' option", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      expect(screen.getByText("All Courses")).toBeInTheDocument();
    });

    test("renders filter label", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      expect(screen.getByText("Filter by Category:")).toBeInTheDocument();
    });

    test("renders with empty categories array", () => {
      render(
        <CategoryFilter
          categories={[]}
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      // Should still render "All Courses" and label
      expect(screen.getByText("All Courses")).toBeInTheDocument();
      expect(screen.getByText("Filter by Category:")).toBeInTheDocument();
    });
  });

  describe("Selection Handling", () => {
    test("calls onCategorySelect when a category is clicked", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      const webDevChip = screen.getByText("Web Development");
      fireEvent.click(webDevChip);

      expect(mockOnCategorySelect).toHaveBeenCalledTimes(1);
      expect(mockOnCategorySelect).toHaveBeenCalledWith("1");
    });

    test("highlights selected category", () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory="2"
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      // The selected category chip should have different styling
      // This is a basic check - actual implementation may vary based on MUI styling
      const dataScienceChip = screen.getByText("Data Science").closest("div");
      expect(dataScienceChip).toHaveClass("MuiChip-filled");
    });

    test("does not highlight unselected categories", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory="2"
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      const webDevChip = screen.getByText("Web Development").closest("div");
      expect(webDevChip).toHaveClass("MuiChip-outlined");
    });
  });

  describe("Clear Filter Functionality", () => {
    test("calls onClearFilter when 'All Courses' is clicked", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory="1"
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      const allCoursesChip = screen.getByText("All Courses");
      fireEvent.click(allCoursesChip);

      expect(mockOnClearFilter).toHaveBeenCalledTimes(1);
    });

    test("highlights 'All Courses' when no category is selected", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      const allCoursesChip = screen.getByText("All Courses").closest("div");
      expect(allCoursesChip).toHaveClass("MuiChip-filled");
    });

    test("does not highlight 'All Courses' when a category is selected", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory="1"
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      const allCoursesChip = screen.getByText("All Courses").closest("div");
      expect(allCoursesChip).toHaveClass("MuiChip-outlined");
    });
  });

  describe("Responsive Behavior", () => {
    test("renders with responsive styling classes", () => {
      const { container } = render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      // Check that the main container has flex-wrap for responsive layout
      const mainBox = container.firstChild;
      expect(mainBox).toHaveStyle({ display: "flex" });
    });

    test("handles multiple categories without breaking layout", () => {
      const manyCategories = Array.from({ length: 10 }, (_, i) => ({
        categoryId: `${i + 1}`,
        name: `Category ${i + 1}`,
      }));

      render(
        <CategoryFilter
          categories={manyCategories}
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      // All categories should be rendered
      manyCategories.forEach((cat) => {
        expect(screen.getByText(cat.name)).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    test("handles missing callback functions gracefully", () => {
      render(
        <CategoryFilter categories={mockCategories} selectedCategory={null} />
      );

      // Should not throw error when clicking without callbacks
      const webDevChip = screen.getByText("Web Development");
      expect(() => fireEvent.click(webDevChip)).not.toThrow();

      const allCoursesChip = screen.getByText("All Courses");
      expect(() => fireEvent.click(allCoursesChip)).not.toThrow();
    });

    test("handles undefined categories prop", () => {
      render(
        <CategoryFilter
          selectedCategory={null}
          onCategorySelect={mockOnCategorySelect}
          onClearFilter={mockOnClearFilter}
        />
      );

      // Should still render with default empty array
      expect(screen.getByText("All Courses")).toBeInTheDocument();
    });
  });
});

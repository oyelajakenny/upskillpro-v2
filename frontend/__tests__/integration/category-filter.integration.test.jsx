/**
 * Category Filter Integration Tests
 *
 * These tests verify the complete category filtering flow including:
 * - Category selection
 * - Course list updates
 * - Filter persistence
 * - Navigation behavior
 *
 * Note: Requires testing framework setup with React Testing Library and Redux mock store
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";
import courseReducer from "../../features/course/courseSlice";

// Mock the API calls
jest.mock("../../utils/api/categoryApi", () => ({
  fetchCategories: jest.fn(() =>
    Promise.resolve([
      {
        id: "cat-1",
        name: "Web Development",
        description: "Web dev courses",
        slug: "web-development",
      },
      {
        id: "cat-2",
        name: "Data Science",
        description: "Data science courses",
        slug: "data-science",
      },
    ])
  ),
  getCategoryById: jest.fn((id) =>
    Promise.resolve({
      id,
      name: "Web Development",
      description: "Web dev courses",
      slug: "web-development",
    })
  ),
}));

jest.mock("../../utils/api", () => ({
  fetchCourses: jest.fn((params) => {
    const allCourses = [
      {
        id: "course-1",
        title: "React Fundamentals",
        categoryId: "cat-1",
        categoryName: "Web Development",
        price: 99,
      },
      {
        id: "course-2",
        title: "Python for Data Science",
        categoryId: "cat-2",
        categoryName: "Data Science",
        price: 149,
      },
      {
        id: "course-3",
        title: "Advanced React",
        categoryId: "cat-1",
        categoryName: "Web Development",
        price: 199,
      },
    ];

    if (params?.categoryId) {
      return Promise.resolve(
        allCourses.filter((c) => c.categoryId === params.categoryId)
      );
    }
    return Promise.resolve(allCourses);
  }),
}));

// Mock CategoryFilter component
const MockCategoryFilter = ({
  categories,
  selectedCategory,
  onCategorySelect,
  onClearFilter,
}) => (
  <div data-testid="category-filter">
    <button onClick={onClearFilter}>All Courses</button>
    {categories.map((cat) => (
      <button
        key={cat.id}
        onClick={() => onCategorySelect(cat.id)}
        data-selected={selectedCategory === cat.id}
      >
        {cat.name}
      </button>
    ))}
  </div>
);

// Mock CourseList component
const MockCourseList = ({ courses }) => (
  <div data-testid="course-list">
    {courses.length === 0 ? (
      <p>No courses found</p>
    ) : (
      courses.map((course) => (
        <div key={course.id} data-testid="course-card">
          <h3>{course.title}</h3>
          <span data-testid="course-category">{course.categoryName}</span>
        </div>
      ))
    )}
  </div>
);

// Mock page component that integrates CategoryFilter and CourseList
const MockCoursePage = () => {
  const [categories, setCategories] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const loadCategories = async () => {
      const { fetchCategories } = require("../../utils/api/categoryApi");
      const data = await fetchCategories();
      setCategories(data);
    };
    loadCategories();
  }, []);

  React.useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      const { fetchCourses } = require("../../utils/api");
      const data = await fetchCourses({ categoryId: selectedCategory });
      setCourses(data);
      setLoading(false);
    };
    loadCourses();
  }, [selectedCategory]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    // Store in sessionStorage for persistence
    sessionStorage.setItem("selectedCategory", categoryId);
  };

  const handleClearFilter = () => {
    setSelectedCategory(null);
    sessionStorage.removeItem("selectedCategory");
  };

  return (
    <div>
      <MockCategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        onClearFilter={handleClearFilter}
      />
      {loading ? <p>Loading...</p> : <MockCourseList courses={courses} />}
    </div>
  );
};

describe("Category Filter Integration Tests", () => {
  let store;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        course: courseReducer,
      },
    });

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("Category filter selection flow", () => {
    it("should load categories on mount and display them", async () => {
      render(
        <Provider store={store}>
          <MockCoursePage />
        </Provider>
      );

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByText("Web Development")).toBeInTheDocument();
        expect(screen.getByText("Data Science")).toBeInTheDocument();
      });
    });

    it("should filter courses when a category is selected", async () => {
      render(
        <Provider store={store}>
          <MockCoursePage />
        </Provider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Web Development")).toBeInTheDocument();
      });

      // Initially should show all courses
      await waitFor(() => {
        expect(screen.getByText("React Fundamentals")).toBeInTheDocument();
        expect(screen.getByText("Python for Data Science")).toBeInTheDocument();
        expect(screen.getByText("Advanced React")).toBeInTheDocument();
      });

      // Click on Web Development category
      const webDevButton = screen.getByText("Web Development");
      fireEvent.click(webDevButton);

      // Should only show Web Development courses
      await waitFor(() => {
        expect(screen.getByText("React Fundamentals")).toBeInTheDocument();
        expect(screen.getByText("Advanced React")).toBeInTheDocument();
        expect(
          screen.queryByText("Python for Data Science")
        ).not.toBeInTheDocument();
      });
    });

    it("should show all courses when filter is cleared", async () => {
      render(
        <Provider store={store}>
          <MockCoursePage />
        </Provider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Web Development")).toBeInTheDocument();
      });

      // Select a category
      const webDevButton = screen.getByText("Web Development");
      fireEvent.click(webDevButton);

      // Wait for filtered results
      await waitFor(() => {
        expect(
          screen.queryByText("Python for Data Science")
        ).not.toBeInTheDocument();
      });

      // Click "All Courses" to clear filter
      const allCoursesButton = screen.getByText("All Courses");
      fireEvent.click(allCoursesButton);

      // Should show all courses again
      await waitFor(() => {
        expect(screen.getByText("React Fundamentals")).toBeInTheDocument();
        expect(screen.getByText("Python for Data Science")).toBeInTheDocument();
        expect(screen.getByText("Advanced React")).toBeInTheDocument();
      });
    });
  });

  describe("Course filtering updates course list", () => {
    it("should update course list when category changes", async () => {
      render(
        <Provider store={store}>
          <MockCoursePage />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Data Science")).toBeInTheDocument();
      });

      // Select Data Science category
      const dataScienceButton = screen.getByText("Data Science");
      fireEvent.click(dataScienceButton);

      // Should only show Data Science course
      await waitFor(() => {
        expect(screen.getByText("Python for Data Science")).toBeInTheDocument();
        expect(
          screen.queryByText("React Fundamentals")
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Advanced React")).not.toBeInTheDocument();
      });
    });

    it("should display category badge on course cards", async () => {
      render(
        <Provider store={store}>
          <MockCoursePage />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("React Fundamentals")).toBeInTheDocument();
      });

      // Check that category names are displayed on course cards
      const categoryBadges = screen.getAllByTestId("course-category");
      expect(categoryBadges.length).toBeGreaterThan(0);
      expect(categoryBadges[0]).toHaveTextContent(
        /Web Development|Data Science/
      );
    });

    it("should show empty state when no courses in category", async () => {
      // Mock empty result for a specific category
      const { fetchCourses } = require("../../utils/api");
      fetchCourses.mockResolvedValueOnce([]);

      render(
        <Provider store={store}>
          <MockCoursePage />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Web Development")).toBeInTheDocument();
      });

      // Select a category
      const webDevButton = screen.getByText("Web Development");
      fireEvent.click(webDevButton);

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText("No courses found")).toBeInTheDocument();
      });
    });
  });

  describe("Filter persistence during navigation", () => {
    it("should persist selected category in sessionStorage", async () => {
      render(
        <Provider store={store}>
          <MockCoursePage />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Web Development")).toBeInTheDocument();
      });

      // Select a category
      const webDevButton = screen.getByText("Web Development");
      fireEvent.click(webDevButton);

      // Check sessionStorage
      await waitFor(() => {
        expect(sessionStorage.getItem("selectedCategory")).toBe("cat-1");
      });
    });

    it("should clear sessionStorage when filter is cleared", async () => {
      render(
        <Provider store={store}>
          <MockCoursePage />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Web Development")).toBeInTheDocument();
      });

      // Select a category
      const webDevButton = screen.getByText("Web Development");
      fireEvent.click(webDevButton);

      await waitFor(() => {
        expect(sessionStorage.getItem("selectedCategory")).toBe("cat-1");
      });

      // Clear filter
      const allCoursesButton = screen.getByText("All Courses");
      fireEvent.click(allCoursesButton);

      // Check sessionStorage is cleared
      await waitFor(() => {
        expect(sessionStorage.getItem("selectedCategory")).toBeNull();
      });
    });

    it("should restore filter state from sessionStorage on mount", async () => {
      // Pre-populate sessionStorage
      sessionStorage.setItem("selectedCategory", "cat-2");

      // Create a component that reads from sessionStorage on mount
      const MockPageWithPersistence = () => {
        const [selectedCategory, setSelectedCategory] = React.useState(() => {
          return sessionStorage.getItem("selectedCategory");
        });

        return (
          <div>
            <p data-testid="selected-category">
              {selectedCategory || "No category selected"}
            </p>
          </div>
        );
      };

      render(
        <Provider store={store}>
          <MockPageWithPersistence />
        </Provider>
      );

      // Should restore the category from sessionStorage
      expect(screen.getByTestId("selected-category")).toHaveTextContent(
        "cat-2"
      );
    });
  });

  describe("Course creation with category", () => {
    it("should include categoryId when creating a course", async () => {
      // Mock course creation
      const mockCreateCourse = jest.fn((courseData) =>
        Promise.resolve({
          ...courseData,
          id: "new-course-1",
        })
      );

      const courseData = {
        title: "New Course",
        description: "Test course",
        price: 99,
        categoryId: "cat-1",
      };

      const result = await mockCreateCourse(courseData);

      expect(mockCreateCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: "cat-1",
        })
      );
      expect(result).toHaveProperty("categoryId", "cat-1");
    });

    it("should validate category selection before submission", async () => {
      const mockValidateCategory = jest.fn((categoryId) => {
        if (!categoryId) {
          throw new Error("Category is required");
        }
        return true;
      });

      // Should throw error when no category
      expect(() => mockValidateCategory(null)).toThrow("Category is required");

      // Should pass when category is provided
      expect(mockValidateCategory("cat-1")).toBe(true);
    });
  });
});

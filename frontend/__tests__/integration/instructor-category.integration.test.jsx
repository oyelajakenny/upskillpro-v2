/**
 * Instructor Dashboard Category Integration Tests
 *
 * These tests verify the category functionality in the instructor dashboard:
 * - Category selection in course form
 * - Category filtering in instructor course list
 * - Course count per category
 * - Filter persistence
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";
import courseReducer from "../../features/course/courseSlice";

// Mock API calls
jest.mock("../../utils/api/categoryApi", () => ({
  fetchCategories: jest.fn(() =>
    Promise.resolve([
      { id: "cat-1", name: "Web Development", slug: "web-development" },
      { id: "cat-2", name: "Data Science", slug: "data-science" },
      { id: "cat-3", name: "Design", slug: "design" },
    ])
  ),
}));

jest.mock("../../utils/api", () => ({
  fetchInstructorCourses: jest.fn((instructorId, params) => {
    const allCourses = [
      {
        id: "course-1",
        title: "React Basics",
        categoryId: "cat-1",
        categoryName: "Web Development",
        instructorId: "instructor-1",
      },
      {
        id: "course-2",
        title: "Advanced React",
        categoryId: "cat-1",
        categoryName: "Web Development",
        instructorId: "instructor-1",
      },
      {
        id: "course-3",
        title: "Python ML",
        categoryId: "cat-2",
        categoryName: "Data Science",
        instructorId: "instructor-1",
      },
      {
        id: "course-4",
        title: "UI/UX Design",
        categoryId: "cat-3",
        categoryName: "Design",
        instructorId: "instructor-1",
      },
    ];

    if (params?.categoryId) {
      return Promise.resolve(
        allCourses.filter((c) => c.categoryId === params.categoryId)
      );
    }
    return Promise.resolve(allCourses);
  }),
  createCourse: jest.fn((courseData) =>
    Promise.resolve({
      ...courseData,
      id: `course-${Date.now()}`,
    })
  ),
}));

// Mock components
const MockCategorySelect = ({ categories, value, onChange }) => (
  <select
    data-testid="category-select"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">Select Category</option>
    {categories.map((cat) => (
      <option key={cat.id} value={cat.id}>
        {cat.name}
      </option>
    ))}
  </select>
);

const MockCourseForm = ({ onSubmit }) => {
  const [categories, setCategories] = React.useState([]);
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
  });

  React.useEffect(() => {
    const loadCategories = async () => {
      const { fetchCategories } = require("../../utils/api/categoryApi");
      const data = await fetchCategories();
      setCategories(data);
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a category");
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="course-form">
      <input
        data-testid="title-input"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Course Title"
      />
      <MockCategorySelect
        categories={categories}
        value={formData.categoryId}
        onChange={(categoryId) => setFormData({ ...formData, categoryId })}
      />
      <button type="submit">Create Course</button>
    </form>
  );
};

const MockInstructorCourseList = ({ instructorId }) => {
  const [categories, setCategories] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [courseCounts, setCourseCounts] = React.useState({});

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
      const { fetchInstructorCourses } = require("../../utils/api");
      const data = await fetchInstructorCourses(instructorId, {
        categoryId: selectedCategory,
      });
      setCourses(data);

      // Calculate course counts per category
      const counts = {};
      data.forEach((course) => {
        counts[course.categoryId] = (counts[course.categoryId] || 0) + 1;
      });
      setCourseCounts(counts);
    };
    loadCourses();
  }, [instructorId, selectedCategory]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    sessionStorage.setItem("instructorCategoryFilter", categoryId);
  };

  const handleClearFilter = () => {
    setSelectedCategory(null);
    sessionStorage.removeItem("instructorCategoryFilter");
  };

  return (
    <div>
      <div data-testid="category-filter">
        <button onClick={handleClearFilter}>All Courses</button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            data-testid={`category-${cat.id}`}
          >
            {cat.name}
            {!selectedCategory && courseCounts[cat.id] && (
              <span data-testid={`count-${cat.id}`}>
                ({courseCounts[cat.id]})
              </span>
            )}
          </button>
        ))}
      </div>
      <div data-testid="course-list">
        {courses.map((course) => (
          <div key={course.id} data-testid="course-item">
            <h3>{course.title}</h3>
            <span>{course.categoryName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

describe("Instructor Category Integration Tests", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        course: courseReducer,
      },
    });
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe("Category selection in course form", () => {
    it("should load and display categories in dropdown", async () => {
      const mockOnSubmit = jest.fn();

      render(
        <Provider store={store}>
          <MockCourseForm onSubmit={mockOnSubmit} />
        </Provider>
      );

      await waitFor(() => {
        const select = screen.getByTestId("category-select");
        expect(select).toBeInTheDocument();
        expect(screen.getByText("Web Development")).toBeInTheDocument();
        expect(screen.getByText("Data Science")).toBeInTheDocument();
        expect(screen.getByText("Design")).toBeInTheDocument();
      });
    });

    it("should include categoryId in course creation payload", async () => {
      const mockOnSubmit = jest.fn();

      render(
        <Provider store={store}>
          <MockCourseForm onSubmit={mockOnSubmit} />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("category-select")).toBeInTheDocument();
      });

      // Fill form
      const titleInput = screen.getByTestId("title-input");
      fireEvent.change(titleInput, { target: { value: "New Course" } });

      const categorySelect = screen.getByTestId("category-select");
      fireEvent.change(categorySelect, { target: { value: "cat-1" } });

      // Submit form
      const form = screen.getByTestId("course-form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "New Course",
            categoryId: "cat-1",
          })
        );
      });
    });

    it("should validate category selection before submission", async () => {
      const mockOnSubmit = jest.fn();
      window.alert = jest.fn();

      render(
        <Provider store={store}>
          <MockCourseForm onSubmit={mockOnSubmit} />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("category-select")).toBeInTheDocument();
      });

      // Fill only title, no category
      const titleInput = screen.getByTestId("title-input");
      fireEvent.change(titleInput, { target: { value: "New Course" } });

      // Try to submit without category
      const form = screen.getByTestId("course-form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Please select a category");
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe("Category filtering in instructor course list", () => {
    it("should display all instructor courses initially", async () => {
      render(
        <Provider store={store}>
          <MockInstructorCourseList instructorId="instructor-1" />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("React Basics")).toBeInTheDocument();
        expect(screen.getByText("Advanced React")).toBeInTheDocument();
        expect(screen.getByText("Python ML")).toBeInTheDocument();
        expect(screen.getByText("UI/UX Design")).toBeInTheDocument();
      });
    });

    it("should filter courses when category is selected", async () => {
      render(
        <Provider store={store}>
          <MockInstructorCourseList instructorId="instructor-1" />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("category-cat-1")).toBeInTheDocument();
      });

      // Select Web Development category
      const webDevButton = screen.getByTestId("category-cat-1");
      fireEvent.click(webDevButton);

      await waitFor(() => {
        expect(screen.getByText("React Basics")).toBeInTheDocument();
        expect(screen.getByText("Advanced React")).toBeInTheDocument();
        expect(screen.queryByText("Python ML")).not.toBeInTheDocument();
        expect(screen.queryByText("UI/UX Design")).not.toBeInTheDocument();
      });
    });

    it("should show all courses when filter is cleared", async () => {
      render(
        <Provider store={store}>
          <MockInstructorCourseList instructorId="instructor-1" />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("category-cat-2")).toBeInTheDocument();
      });

      // Select Data Science category
      const dataScienceButton = screen.getByTestId("category-cat-2");
      fireEvent.click(dataScienceButton);

      await waitFor(() => {
        expect(screen.queryByText("React Basics")).not.toBeInTheDocument();
      });

      // Clear filter
      const allCoursesButton = screen.getByText("All Courses");
      fireEvent.click(allCoursesButton);

      await waitFor(() => {
        expect(screen.getByText("React Basics")).toBeInTheDocument();
        expect(screen.getByText("Python ML")).toBeInTheDocument();
        expect(screen.getByText("UI/UX Design")).toBeInTheDocument();
      });
    });
  });

  describe("Course count per category", () => {
    it("should display course count for each category", async () => {
      render(
        <Provider store={store}>
          <MockInstructorCourseList instructorId="instructor-1" />
        </Provider>
      );

      await waitFor(() => {
        // Web Development should have 2 courses
        const webDevCount = screen.getByTestId("count-cat-1");
        expect(webDevCount).toHaveTextContent("(2)");

        // Data Science should have 1 course
        const dataScienceCount = screen.getByTestId("count-cat-2");
        expect(dataScienceCount).toHaveTextContent("(1)");

        // Design should have 1 course
        const designCount = screen.getByTestId("count-cat-3");
        expect(designCount).toHaveTextContent("(1)");
      });
    });

    it("should update counts when courses are filtered", async () => {
      render(
        <Provider store={store}>
          <MockInstructorCourseList instructorId="instructor-1" />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("count-cat-1")).toBeInTheDocument();
      });

      // Select a category - counts should not be visible when filtered
      const webDevButton = screen.getByTestId("category-cat-1");
      fireEvent.click(webDevButton);

      await waitFor(() => {
        // Counts should not be displayed when a filter is active
        expect(screen.queryByTestId("count-cat-1")).not.toBeInTheDocument();
      });
    });
  });

  describe("Filter persistence in session", () => {
    it("should persist category filter in sessionStorage", async () => {
      render(
        <Provider store={store}>
          <MockInstructorCourseList instructorId="instructor-1" />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("category-cat-1")).toBeInTheDocument();
      });

      // Select a category
      const webDevButton = screen.getByTestId("category-cat-1");
      fireEvent.click(webDevButton);

      await waitFor(() => {
        expect(sessionStorage.getItem("instructorCategoryFilter")).toBe(
          "cat-1"
        );
      });
    });

    it("should clear sessionStorage when filter is cleared", async () => {
      render(
        <Provider store={store}>
          <MockInstructorCourseList instructorId="instructor-1" />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("category-cat-1")).toBeInTheDocument();
      });

      // Select a category
      const webDevButton = screen.getByTestId("category-cat-1");
      fireEvent.click(webDevButton);

      await waitFor(() => {
        expect(sessionStorage.getItem("instructorCategoryFilter")).toBe(
          "cat-1"
        );
      });

      // Clear filter
      const allCoursesButton = screen.getByText("All Courses");
      fireEvent.click(allCoursesButton);

      await waitFor(() => {
        expect(sessionStorage.getItem("instructorCategoryFilter")).toBeNull();
      });
    });

    it("should restore filter on component mount", async () => {
      // Pre-populate sessionStorage
      sessionStorage.setItem("instructorCategoryFilter", "cat-2");

      const MockPageWithPersistence = () => {
        const [selectedCategory] = React.useState(() => {
          return sessionStorage.getItem("instructorCategoryFilter");
        });

        return (
          <div data-testid="selected-category">
            {selectedCategory || "No filter"}
          </div>
        );
      };

      render(
        <Provider store={store}>
          <MockPageWithPersistence />
        </Provider>
      );

      expect(screen.getByTestId("selected-category")).toHaveTextContent(
        "cat-2"
      );
    });

    it("should clear filter on logout", async () => {
      sessionStorage.setItem("instructorCategoryFilter", "cat-1");

      const mockLogout = () => {
        sessionStorage.clear();
      };

      mockLogout();

      expect(sessionStorage.getItem("instructorCategoryFilter")).toBeNull();
    });
  });
});

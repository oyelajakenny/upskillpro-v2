"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import CourseGrid from "@/app/_components/HomePageComponents/CoursesGrid";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Box,
  Alert,
  Button,
} from "@mui/material";
import {
  fetchCoursesStart,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
  setSelectedCategory,
  clearCategoryFilter,
} from "@/features/course/courseSlice";
import { useDispatch } from "react-redux";
import { Search, X, RefreshCw } from "lucide-react";
import CourseCard from "@/app/_components/HomePageComponents/CourseCard";
import Skeleton from "@mui/material/Skeleton";
import CategoryFilter from "@/components/CategoryFilter";
import { fetchCategories } from "@/utils/api/categoryApi";
import { toast } from "react-toastify";

const CoursesPage = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    courses,
    loading,
    error,
    categories,
    categoryLoading,
    categoryError,
    selectedCategory,
  } = useSelector((state) => state.courses);
  const [search, setSearch] = useState("");
  const [allCourses, setAllCourses] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      dispatch(fetchCategoriesStart());
      try {
        const categoriesData = await fetchCategories();
        dispatch(fetchCategoriesSuccess(categoriesData));
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        dispatch(fetchCategoriesFailure(error.message));
        toast.error("Failed to load categories. Please try again.");
      }
    };

    loadCategories();
  }, [dispatch]);

  // Retry function for category fetch
  const retryFetchCategories = async () => {
    dispatch(fetchCategoriesStart());
    try {
      const categoriesData = await fetchCategories();
      dispatch(fetchCategoriesSuccess(categoriesData));
      toast.success("Categories loaded successfully!");
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      dispatch(fetchCategoriesFailure(error.message));
      toast.error("Failed to load categories. Please try again.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let updated = false;

    // Add default values if missing
    if (!params.has("sortKey")) {
      params.set("sortKey", "price");
      updated = true;
    }
    if (!params.has("sortDir")) {
      params.set("sortDir", "asc");
      updated = true;
    }

    // Update URL if parameters were added or changed
    if (updated) {
      router.replace(`${pathName}?${params.toString()}`);
    }
  }, [searchParams, pathName, router]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.toString();
  }, [searchParams]);

  useEffect(() => {
    const fetchCourses = async () => {
      dispatch(fetchCoursesStart());

      try {
        const params = new URLSearchParams(searchParams);

        // Add categoryId parameter if a category is selected
        if (selectedCategory) {
          params.set("categoryId", selectedCategory);
        }

        const queryString = params.toString();

        const response = await fetch(`${API_URL}/api/courses?${queryString}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          let errorMessage = "Failed to fetch courses";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
          
          if (response.status === 404) {
            errorMessage = "No courses found";
          } else if (response.status === 403) {
            errorMessage = "You don't have permission to view courses";
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Ensure all courses have rating fields with default values
        const coursesWithRatings = Array.isArray(data)
          ? data.map((course) => ({
              ...course,
              averageRating: course.averageRating || 0,
              ratingCount: course.ratingCount || 0,
            }))
          : [];
        
        setAllCourses(coursesWithRatings);
        dispatch(fetchCoursesSuccess(coursesWithRatings));
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        if (error.message.includes("No courses found")) {
          setAllCourses([]);
          dispatch(fetchCoursesFailure("No courses found"));
        } else if (error.message.includes("Forbidden")) {
          dispatch(
            fetchCoursesFailure("You don't have permission to view courses")
          );
          toast.error("You don't have permission to view courses");
        } else {
          dispatch(fetchCoursesFailure(error.message));
          toast.error("Failed to load courses. Please try again.");
        }
      }
    };

    fetchCourses();
  }, [dispatch, searchParams, API_URL, selectedCategory]);

  // Retry function for course fetch
  const retryFetchCourses = async () => {
    dispatch(fetchCoursesStart());
    try {
      const params = new URLSearchParams(searchParams);

      if (selectedCategory) {
        params.set("categoryId", selectedCategory);
      }

      const queryString = params.toString();

      const response = await fetch(`${API_URL}/api/courses?${queryString}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch courses";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        
        if (response.status === 404) {
          errorMessage = "No courses found";
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to view courses";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Ensure all courses have rating fields with default values
      const coursesWithRatings = Array.isArray(data)
        ? data.map((course) => ({
            ...course,
            averageRating: course.averageRating || 0,
            ratingCount: course.ratingCount || 0,
          }))
        : [];
      
      setAllCourses(coursesWithRatings);
      dispatch(fetchCoursesSuccess(coursesWithRatings));
      toast.success("Courses loaded successfully!");
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      if (error.message.includes("No courses found")) {
        setAllCourses([]);
        dispatch(fetchCoursesFailure("No courses found"));
      } else {
        dispatch(fetchCoursesFailure(error.message));
        toast.error("Failed to load courses. Please try again.");
      }
    }
  };

  const handleChange = (name, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.replace(`${pathName}?${params.toString()}`);
  };

  const handleCategorySelect = (categoryId) => {
    dispatch(setSelectedCategory(categoryId));
  };

  const handleClearFilter = () => {
    dispatch(clearCategoryFilter());
  };

  return (
    <div className="mb-10">
      <div className="w-full bg-gradient-to-r from-gray-500 to-gray-300 py-16">
        <div className="container mx-auto max-w-3xl	">
          <form className="relative">
            <input
              type="text"
              placeholder="Search for courses"
              value={searchParams.get("title") || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full flex-1 rounded-md py-5 border border-darkColor/20 px-5 shadow-lg"
            />
            {search && (
              <X
                onClick={() => setSearch("")}
                className="w-5 h-5 absolute right-11 top-6 hover:text-red-600 hoverEffect"
              />
            )}
            <button
              type="submit"
              className="absolute right-0 top-0 h-full w-10 bg-black flex items-center justify-center 
            rounded-tr-md rounded-br-md text-white hover:bg-gray-500 hover:text-white transition-all ease-in-out duration-300"
            >
              <Search className="w-5 h-5 " />
            </button>
          </form>
        </div>
      </div>
      <div className="container mx-auto items-center px-5 ">
        <h2 className=" font-medium text-[30px] text-[#00000] text-center my-3">
          Explore Courses
        </h2>

        {/* Category Error Alert */}
        {categoryError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={retryFetchCategories}
                startIcon={<RefreshCw className="w-4 h-4" />}
              >
                Retry
              </Button>
            }
          >
            Failed to load categories: {categoryError}
          </Alert>
        )}

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          onClearFilter={handleClearFilter}
          loading={categoryLoading}
          disabled={loading}
        />

        <div className="flex  gap-5 mb-5">
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel className="text-lg">Sort By</InputLabel>
              <Select
                value={searchParams.get("sortKey") || ""}
                label="Sort By"
                onChange={(e) => handleChange("sortKey", e.target.value)}
              >
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="createdAt">Created At</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel className="text-lg">Direction</InputLabel>
              <Select
                value={searchParams.get("sortDir") || ""}
                label="Direction"
                onChange={(e) => handleChange("sortDir", e.target.value)}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </div>

        {/* Course Error Alert */}
        {error && !loading && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={retryFetchCourses}
                startIcon={<RefreshCw className="w-4 h-4" />}
              >
                Retry
              </Button>
            }
          >
            {error === "No courses found"
              ? "No courses available at the moment."
              : `Failed to load courses: ${error}`}
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <CourseSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : allCourses && allCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            selectedCategory={selectedCategory}
            onClearFilter={handleClearFilter}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
};

export default CoursesPage;

const CourseSkeleton = () => {
  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-lg overflow-hidden">
      <Skeleton className="w-full h-36" />
      <div className="px-5 py-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
};

const EmptyState = ({ selectedCategory, onClearFilter, categories }) => {
  const selectedCategoryName = categories.find(
    (cat) => cat.categoryId === selectedCategory
  )?.name;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          No courses found
        </h3>
        <p className="text-gray-600 mb-6">
          {selectedCategory
            ? `There are currently no courses available in the "${selectedCategoryName}" category.`
            : "There are currently no courses available."}
        </p>
        {selectedCategory && (
          <button
            onClick={onClearFilter}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            View All Courses
          </button>
        )}
      </div>
    </div>
  );
};

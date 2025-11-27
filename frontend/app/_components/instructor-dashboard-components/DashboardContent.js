"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
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
import InstructorCard from "./InstructorCard";
import { Skeleton } from "@mui/material";
import CategoryFilter from "@/components/CategoryFilter";
import { fetchCategories } from "@/utils/api/categoryApi";

const DashboardContent = () => {
  const router = useRouter();
  const [allCourses, setAllCourses] = useState([]);
  const dispatch = useDispatch();
  const {
    courses,
    loading,
    error,
    categories,
    selectedCategory,
    categoryLoading,
  } = useSelector((state) => state.courses);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      dispatch(fetchCategoriesStart());
      try {
        const categoriesData = await fetchCategories();
        dispatch(fetchCategoriesSuccess(categoriesData));
      } catch (error) {
        console.error("Error fetching categories:", error);
        dispatch(fetchCategoriesFailure(error.message));
      }
    };
    loadCategories();
  }, [dispatch]);

  // Restore selected category from sessionStorage on mount
  useEffect(() => {
    const savedCategory = sessionStorage.getItem("instructorSelectedCategory");
    if (savedCategory && savedCategory !== "null") {
      dispatch(setSelectedCategory(savedCategory));
    }
  }, [dispatch]);

  // Fetch courses when selectedCategory changes
  useEffect(() => {
    const fetchProjectsByInstructor = async () => {
      dispatch(fetchCoursesStart());
      try {
        // Build URL with optional categoryId parameter
        let url = `${process.env.NEXT_PUBLIC_API_URL}/api/courses/all`;
        if (selectedCategory) {
          url += `?categoryId=${selectedCategory}`;
        }

        const apiResponse = await fetch(url, {
          method: "GET",
          credentials: "include", // This ensures cookies are sent with the request
        });

        if (!apiResponse.ok) {
          if (apiResponse.status === 404) {
            throw new Error("No courses found");
          }
          const errorText = await apiResponse.json();
          throw new Error(errorText.message);
        }

        const coursesData = await apiResponse.json();
        setAllCourses(coursesData);
        dispatch(fetchCoursesSuccess(coursesData));
      } catch (error) {
        if (error.message.includes("No courses found")) {
          setAllCourses([]);
          dispatch(fetchCoursesFailure("No courses found"));
        } else if (error.message.includes("Forbidden")) {
          dispatch(
            fetchCoursesFailure("You don't have permission to view courses")
          );
        } else {
          dispatch(fetchCoursesFailure(error.message));
        }
      }
    };
    fetchProjectsByInstructor();
  }, [dispatch, selectedCategory]);

  const handleNavigation = () => {
    router.push("instructor-dashboard/add-course");
  };

  const handleOnClick = (id) => {
    router.push(`instructor-dashboard/courses/${id}/add-lecture`);
  };

  const handleCategorySelect = (categoryId) => {
    dispatch(setSelectedCategory(categoryId));
    // Persist to sessionStorage
    sessionStorage.setItem("instructorSelectedCategory", categoryId);
  };

  const handleClearFilter = () => {
    dispatch(clearCategoryFilter());
    // Clear from sessionStorage
    sessionStorage.removeItem("instructorSelectedCategory");
  };

  const handleCourseDelete = (courseId) => {
    // Remove the deleted course from the local state
    setAllCourses((prevCourses) =>
      prevCourses.filter((course) => course.id !== courseId)
    );
    // Also update Redux state
    dispatch(
      fetchCoursesSuccess(allCourses.filter((course) => course.id !== courseId))
    );
  };

  // Calculate course count per category
  const getCategoryCourseCounts = () => {
    const counts = {};
    courses.forEach((course) => {
      if (course.categoryId) {
        counts[course.categoryId] = (counts[course.categoryId] || 0) + 1;
      }
    });
    return counts;
  };

  const categoryCourseCounts = getCategoryCourseCounts();

  // Enhance categories with course counts
  const categoriesWithCounts = categories.map((category) => ({
    ...category,
    courseCount: categoryCourseCounts[category.categoryId] || 0,
  }));

  return (
    <div>
      <Card>
        <CardHeader className="flex justify-between flex-row items-center">
          <CardTitle className="font-extrabold text-3xl">All Courses</CardTitle>
          <Button
            className="p-5 hover:bg-[#374151] hover:text-white border border-gray-900"
            onClick={handleNavigation}
          >
            Create New Course
          </Button>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <CategoryFilter
            categories={categoriesWithCounts}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            onClearFilter={handleClearFilter}
            loading={categoryLoading}
            disabled={loading}
          />

          <div className="container my-10 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <CourseSkeleton key={index} />
                ))
              ) : allCourses.length > 0 ? (
                allCourses.map((course, index) => (
                  <InstructorCard
                    key={course.id}
                    course={course}
                    onDelete={handleCourseDelete}
                  />
                ))
              ) : (
                <p className="text-lg text-gray-600 mt-4">
                  {selectedCategory
                    ? "No courses found in this category."
                    : "No courses available at the moment."}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardContent;

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

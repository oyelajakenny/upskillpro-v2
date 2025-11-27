"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchCategories } from "@/utils/api/categoryApi";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
} from "@/features/course/courseSlice";
import Skeleton from "@mui/material/Skeleton";

const CategorySection = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { categories, categoryLoading, categoryError } = useSelector(
    (state) => state.courses
  );

  // Fetch categories on component mount
  useEffect(() => {
    if (!categories || categories.length === 0) {
      const loadCategories = async () => {
        dispatch(fetchCategoriesStart());
        try {
          const categoriesData = await fetchCategories();
          dispatch(fetchCategoriesSuccess(categoriesData));
        } catch (error) {
          console.error("Failed to fetch categories:", error);
          dispatch(
            fetchCategoriesFailure(
              error.message || "Failed to load categories"
            )
          );
        }
      };

      loadCategories();
    }
  }, [dispatch, categories]);

  const handleCategoryClick = (categoryId) => {
    router.push(`/courses?categoryId=${categoryId}`);
  };

  return (
    <div className="w-full h-auto">
      <div>
        <div>
          <div className=" container mx-auto py-10 px-10 md:py-10  ">
            <h2 className=" text-5xl text-center font-bold leading-tight	 text-gray-500 lg:text-7xl">
              Study Smarter, Dream
              <br /> Bigger, Achieve More.
            </h2>
          </div>
          <div className="flex items-center justify-center flex-wrap my-5 gap-2 ">
            <h2 className="mr-5 font-semibold">Top Categories</h2>
            {categoryLoading ? (
              // Show skeleton loaders while loading
              Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={`skeleton-${index}`}
                  variant="rounded"
                  width={120}
                  height={40}
                  sx={{ borderRadius: "4px", marginBottom: 1 }}
                />
              ))
            ) : categoryError ? (
              // Show error message
              <div className="text-red-600 text-sm">
                Failed to load categories. Please try again later.
              </div>
            ) : categories && categories.length > 0 ? (
              // Show real categories
              <>
                {categories.slice(0, 6).map((category) => (
                  <div key={category.categoryId} className="mb-4">
                    <Link
                      href={`/courses?categoryId=${category.categoryId}`}
                      className="border border-gray-700 py-2 px-5 hover:bg-slate-950 hover:text-white transition ease-in-out delay-150"
                    >
                      {category.name}
                    </Link>
                  </div>
                ))}
                <div className="mb-4">
                  <Link
                    href="/courses"
                    className="border border-gray-700 py-2 px-5 hover:bg-slate-950 hover:text-white transition ease-in-out delay-150"
                  >
                    View All
                  </Link>
                </div>
              </>
            ) : (
              // Show message if no categories
              <div className="text-gray-500 text-sm">
                No categories available at the moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySection;

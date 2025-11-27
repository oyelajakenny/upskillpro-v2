"use client";
import React from "react";
import { Chip, Box, Skeleton, CircularProgress } from "@mui/material";

/**
 * CategoryFilter Component
 *
 * Displays a list of course categories as clickable chips/buttons.
 * Allows users to filter courses by selecting a category or view all courses.
 *
 * @param {Object} props
 * @param {Array} props.categories - Array of category objects with id, name, etc.
 * @param {string|null} props.selectedCategory - Currently selected category ID
 * @param {Function} props.onCategorySelect - Callback when a category is selected
 * @param {Function} props.onClearFilter - Callback when "All Courses" is clicked
 * @param {boolean} props.loading - Whether categories are being loaded
 * @param {boolean} props.disabled - Whether filter buttons should be disabled
 */
const CategoryFilter = ({
  categories = [],
  selectedCategory = null,
  onCategorySelect,
  onClearFilter,
  loading = false,
  disabled = false,
}) => {
  const handleCategoryClick = (categoryId) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  const handleClearFilter = () => {
    if (onClearFilter) {
      onClearFilter();
    }
  };

  // Show skeleton loaders while loading
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          padding: { xs: 2, sm: 2.5 },
          backgroundColor: "#f9fafb",
          borderRadius: 2,
          marginBottom: 3,
        }}
      >
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "0.875rem", sm: "1rem" },
            color: "#374151",
            marginRight: { xs: 0, sm: 1 },
            width: { xs: "100%", sm: "auto" },
            marginBottom: { xs: 1, sm: 0 },
          }}
        >
          Filter by Category:
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={`skeleton-${index}`}
              variant="rounded"
              width={100}
              height={32}
              sx={{ borderRadius: "16px" }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        alignItems: "center",
        padding: { xs: 2, sm: 2.5 },
        backgroundColor: "#f9fafb",
        borderRadius: 2,
        marginBottom: 3,
      }}
    >
      {/* Label */}
      <Box
        component="span"
        sx={{
          fontWeight: 600,
          fontSize: { xs: "0.875rem", sm: "1rem" },
          color: "#374151",
          marginRight: { xs: 0, sm: 1 },
          width: { xs: "100%", sm: "auto" },
          marginBottom: { xs: 1, sm: 0 },
        }}
      >
        Filter by Category:
      </Box>

      {/* All Courses Chip */}
      <Chip
        label="All Courses"
        onClick={handleClearFilter}
        disabled={disabled}
        color={selectedCategory === null ? "primary" : "default"}
        variant={selectedCategory === null ? "filled" : "outlined"}
        sx={{
          fontWeight: selectedCategory === null ? 600 : 400,
          fontSize: { xs: "0.813rem", sm: "0.875rem" },
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: disabled ? "none" : "translateY(-2px)",
            boxShadow: disabled ? 0 : 2,
          },
        }}
      />

      {/* Category Chips */}
      {categories.map((category) => {
        const isSelected = selectedCategory === category.categoryId;
        const courseCount = category.courseCount;
        const label =
          courseCount !== undefined
            ? `${category.name} (${courseCount})`
            : category.name;

        return (
          <Chip
            key={category.categoryId}
            label={label}
            onClick={() => handleCategoryClick(category.categoryId)}
            disabled={disabled}
            color={isSelected ? "primary" : "default"}
            variant={isSelected ? "filled" : "outlined"}
            sx={{
              fontWeight: isSelected ? 600 : 400,
              fontSize: { xs: "0.813rem", sm: "0.875rem" },
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: disabled ? "none" : "translateY(-2px)",
                boxShadow: disabled ? 0 : 2,
              },
            }}
          />
        );
      })}
    </Box>
  );
};

export default CategoryFilter;

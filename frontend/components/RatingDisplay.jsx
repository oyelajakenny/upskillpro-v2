"use client";
import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RatingDisplay Component
 *
 * Displays average rating as stars and numerical value with rating count.
 * Supports different size variants and handles zero ratings case.
 *
 * @param {Object} props
 * @param {number} props.averageRating - Average rating value (0-5)
 * @param {number} props.ratingCount - Total number of ratings
 * @param {string} props.size - Size variant: 'small', 'medium', or 'large'
 * @param {string} props.className - Additional CSS classes
 */
const RatingDisplay = ({
  averageRating = 0,
  ratingCount = 0,
  size = "medium",
  className = "",
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      starSize: "w-3 h-3",
      textSize: "text-xs",
      gap: "gap-1",
    },
    medium: {
      starSize: "w-4 h-4",
      textSize: "text-sm",
      gap: "gap-1.5",
    },
    large: {
      starSize: "w-6 h-6",
      textSize: "text-lg",
      gap: "gap-2",
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Render stars based on rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <Star
            key={i}
            className={cn(config.starSize, "fill-yellow-400 text-yellow-400")}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className="relative">
            <Star className={cn(config.starSize, "text-gray-300")} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: "50%" }}
            >
              <Star
                className={cn(
                  config.starSize,
                  "fill-yellow-400 text-yellow-400"
                )}
              />
            </div>
          </div>
        );
      } else {
        // Empty star
        stars.push(
          <Star key={i} className={cn(config.starSize, "text-gray-300")} />
        );
      }
    }

    return stars;
  };

  // Handle zero ratings case
  if (ratingCount === 0) {
    return (
      <div className={cn("flex items-center", config.gap, className)}>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={cn(config.starSize, "text-gray-300")} />
          ))}
        </div>
        <span className={cn(config.textSize, "text-gray-500")}>
          No ratings yet
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", config.gap, className)}>
      <div className="flex items-center">{renderStars()}</div>
      <span className={cn(config.textSize, "font-semibold text-gray-900")}>
        {averageRating.toFixed(1)}
      </span>
      <span className={cn(config.textSize, "text-gray-500")}>
        ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
      </span>
    </div>
  );
};

export default RatingDisplay;

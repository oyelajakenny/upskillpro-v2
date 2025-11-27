"use client";
import React from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * RatingStats Component
 *
 * Displays rating distribution as a bar chart showing 1-5 star counts.
 * Designed for instructor analytics to visualize rating breakdown.
 *
 * @param {Object} props
 * @param {Object} props.distribution - Rating distribution object { 1: count, 2: count, ..., 5: count }
 * @param {number} props.totalRatings - Total number of ratings
 * @param {number} props.averageRating - Average rating value (optional)
 * @param {string} props.className - Additional CSS classes
 */
const RatingStats = ({
  distribution = {},
  totalRatings = 0,
  averageRating = null,
  className = "",
}) => {
  // Ensure distribution has all star values (1-5)
  const normalizedDistribution = {
    5: distribution[5] || 0,
    4: distribution[4] || 0,
    3: distribution[3] || 0,
    2: distribution[2] || 0,
    1: distribution[1] || 0,
  };

  // Calculate percentage for each rating
  const getPercentage = (count) => {
    if (totalRatings === 0) return 0;
    return Math.round((count / totalRatings) * 100);
  };

  // Calculate average if not provided
  const calculatedAverage =
    averageRating !== null
      ? averageRating
      : totalRatings > 0
      ? Object.entries(normalizedDistribution).reduce(
          (sum, [stars, count]) => sum + parseInt(stars) * count,
          0
        ) / totalRatings
      : 0;

  // Empty state
  if (totalRatings === 0) {
    return (
      <Card className={cn("border-gray-200", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No ratings yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Rating statistics will appear here once students start rating this
              course.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-gray-200", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Rating Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-900">
                {calculatedAverage.toFixed(1)}
              </span>
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-sm text-gray-600">
              Based on {totalRatings}{" "}
              {totalRatings === 1 ? "rating" : "ratings"}
            </p>
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="space-y-3">
          {Object.entries(normalizedDistribution)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([stars, count]) => {
              const percentage = getPercentage(count);
              return (
                <div key={stars} className="flex items-center gap-3">
                  {/* Star Label */}
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700">
                      {stars}
                    </span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>

                  {/* Progress Bar */}
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 ease-out",
                        parseInt(stars) >= 4
                          ? "bg-green-500"
                          : parseInt(stars) === 3
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Count and Percentage */}
                  <div className="flex items-center gap-2 w-24 text-right">
                    <span className="text-sm font-medium text-gray-700">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500 w-12">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Additional Stats */}
        <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {getPercentage(
                normalizedDistribution[5] + normalizedDistribution[4]
              )}
              %
            </p>
            <p className="text-xs text-gray-600 mt-1">Positive (4-5★)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {getPercentage(normalizedDistribution[3])}%
            </p>
            <p className="text-xs text-gray-600 mt-1">Neutral (3★)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {getPercentage(
                normalizedDistribution[2] + normalizedDistribution[1]
              )}
              %
            </p>
            <p className="text-xs text-gray-600 mt-1">Negative (1-2★)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RatingStats;

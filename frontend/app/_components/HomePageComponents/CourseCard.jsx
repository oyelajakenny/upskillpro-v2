import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import Link from "next/link";
import { Currency, DollarSign, DollarSignIcon } from "lucide-react";
import { Money } from "@mui/icons-material";
import { FaChalkboardTeacher } from "react-icons/fa";
import RatingDisplay from "@/components/RatingDisplay";

const CourseCard = ({ course }) => {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="overflow-hidden rounded-lg dark:bg-gray-800 bg-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
        <div className="relative">
          <img
            src={course.imageUrl}
            alt="course"
            className="w-full h-36 object-cover rounded-t-lg"
          />
          {/* Category Badge on Image */}
          <div className="absolute top-2 left-2">
            <Badge
              className={`${
                course.categoryName ? "bg-purple-600" : "bg-gray-500"
              } text-white px-3 py-1 text-xs font-semibold rounded-full shadow-md`}
            >
              {course.categoryName || "Uncategorized"}
            </Badge>
          </div>
        </div>
        <CardContent className="px-5 py-4 space-y-2">
          <h1 className="hover:underline font-bold text-lg truncate">
            {course.title}
          </h1>
          <p className="text-sm text-gray-500 line-clamp-1">
            {course.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <h1 className="font-medium text-sm flex items-center gap-2 text-gray-600">
                <FaChalkboardTeacher className="text-gray-600" /> Created by:{" "}
                {course.instructor.name}
              </h1>
            </div>
          </div>
          <RatingDisplay
            averageRating={course.averageRating || 0}
            ratingCount={course.ratingCount || 0}
            size="small"
          />
          <div className="text-lg font-bold flex justify-between items-center">
            <span className="text-green-700 flex items-center">
              {course.price}
              Dkk
            </span>
            <Badge
              className={
                "bg-blue-600 text-white px-2 py-1 text-xs rounded-full"
              }
            >
              BestSeller
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CourseCard;

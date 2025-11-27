import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import RatingDisplay from "@/components/RatingDisplay";
import { Trash2, Edit, Plus } from "lucide-react";
import { toast } from "react-toastify";

const InstructorCard = ({ course, onDelete }) => {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddLecture = (id) => {
    router.push(`instructor-dashboard/courses/${id}/add-lecture`);
  };

  const handleEdit = (id) => {
    router.push(`instructor-dashboard/courses/${id}/edit-course`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${course.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Course deleted successfully!");
        setShowDeleteConfirm(false);
        if (onDelete) {
          onDelete(course.id);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("An error occurred while deleting the course");
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <Card className="overflow-hidden rounded-lg dark:bg-gray-800 bg-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ">
      <div className="relative">
        <img
          src={course.imageUrl}
          alt={`Image of ${course.title}`}
          className="w-full h-auto object-cover aspect-video rounded-t-lg"
        />
        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            className={`${
              course.categoryName ? "bg-purple-600" : "bg-gray-500"
            } text-white px-2 py-1 text-xs font-semibold rounded-full shadow-md`}
          >
            {course.categoryName || "Uncategorized"}
          </Badge>
        </div>
      </div>
      <CardContent className="px-3 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3">
        <h1 className="hover:underline font-bold text-base sm:text-lg truncate">
          {course.title}
        </h1>
        <div className="py-2">
          <RatingDisplay
            averageRating={course.averageRating || 0}
            ratingCount={course.ratingCount || 0}
            size="small"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            className="flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-sm rounded hover:bg-gray-700 transition-colors"
            onClick={() => handleAddLecture(course.id)}
          >
            <Plus className="w-4 h-4" />
            Add Lecture
          </button>
          <button
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            onClick={() => handleEdit(course.id)}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </CardContent>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Delete Course</h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{course.title}</strong>?
            </p>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete the course and all its lectures. This
              action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default InstructorCard;

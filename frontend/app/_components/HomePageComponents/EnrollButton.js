"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enrollCourse } from "@/features/course/courseSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const EnrollButton = ({ courseId, setLoading, isEnrolled }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [buttonText, setButtonText] = useState("Enroll");

  useEffect(() => {
    console.log("EnrollButton - isAuthenticated:", isAuthenticated);
    console.log("EnrollButton - isEnrolled:", isEnrolled);
    console.log("EnrollButton - courseId:", courseId);

    if (!isAuthenticated) {
      setButtonText("Login to Enroll");
    } else {
      setButtonText(isEnrolled ? "Go To Progress" : "Enroll Now");
    }
  }, [isAuthenticated, isEnrolled, courseId]);

  const handleEnrollClick = async () => {
    if (!isAuthenticated) {
      toast.info("Please login to enroll in this course");
      router.push("/login");
    } else if (isEnrolled) {
      router.push(`/courses/${courseId}/progress`);
    } else {
      try {
        setLoading(true);
        const apiResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/enroll/${courseId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        if (apiResponse.ok) {
          await apiResponse.json();
          dispatch(enrollCourse(courseId));
          toast.success("Successfully enrolled in the course!");
          // Refresh the page to update enrollment status
          window.location.reload();
        } else {
          const error = await apiResponse.json();
          console.error("Error creating the enrollment", error);
          toast.error(error.error || "Failed to enroll in course");
        }
      } catch (error) {
        console.error("error while submitting data", error.message);
        toast.error("An error occurred while enrolling");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleEnrollClick}
      className={`rounded-md text-xl shadow-lg font-semibold w-full py-5 transition-all ease-in-out duration-300 ${
        isEnrolled
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-blue-700 text-white hover:bg-blue-600"
      }`}
    >
      {buttonText}
    </button>
  );
};

export default EnrollButton;

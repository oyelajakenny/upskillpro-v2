"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import "@/app/_styles/globals.css";
import Navbar from "../_components/instructor-dashboard-components/Navbar";

export default function InstructorDashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "instructor") {
      // Redirect non-instructors to their appropriate dashboard
      if (user?.role === "student") {
        router.push("/student-dashboard");
      } else if (user?.role === "admin" || user?.role === "super_admin") {
        router.push("/admin-dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "instructor") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

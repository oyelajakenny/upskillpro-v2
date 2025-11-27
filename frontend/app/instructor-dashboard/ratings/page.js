"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import InstructorRatingAnalytics from "@/app/_components/instructor-dashboard-components/InstructorRatingAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const InstructorRatingsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/instructor-dashboard"
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Course Ratings</h1>
        <p className="text-gray-600 mt-2">
          View student feedback and ratings for your courses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rating Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <InstructorRatingAnalytics />
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorRatingsPage;

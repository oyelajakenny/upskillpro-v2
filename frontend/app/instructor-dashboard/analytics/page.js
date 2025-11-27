"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BarChart from "@/app/student-dashboard/components/Analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const InstructorAnalyticsPage = () => {
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track your course performance and revenue
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart />
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorAnalyticsPage;

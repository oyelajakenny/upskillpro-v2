"use client";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import AnalyticsCard from "./AnalyticsCard";

const BarChart = () => {
  const [coursesRevenue, setCoursesRevenue] = useState([]);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [chartHeight, setChartHeight] = useState(600);

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchRevenue = async () => {
      try {
        setLoading(true);
        const apiResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/enroll/revenue`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (apiResponse.status === 404) {
          setCoursesRevenue([]);
          return;
        }

        if (apiResponse.ok) {
          const responseData = await apiResponse.json();
          if (responseData && Array.isArray(responseData.revenueData)) {
            setCoursesRevenue(responseData.revenueData);
          } else {
            setCoursesRevenue([]);
          }
        } else {
          console.error("Error fetching revenue data.");
        }
      } catch (error) {
        console.error("Error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [isAuthenticated]);

  // Handle responsive chart height
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setChartHeight(300);
      else if (window.innerWidth < 1024) setChartHeight(450);
      else setChartHeight(600);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!Array.isArray(coursesRevenue) || coursesRevenue.length === 0) {
    return <p className="text-center">No revenue data available</p>;
  }

  const chartData = {
    labels: coursesRevenue.map((course) => course.course?.title || "Unknown"),
    datasets: [
      {
        label: "Total Revenue",
        data: coursesRevenue.map((course) => Number(course.totalRevenue) || 0),
        backgroundColor: coursesRevenue.map(
          (_, index) =>
            [
              "rgba(0,0,0)",
              "rgba(97, 97, 97, 0.6)",
              "rgba(161, 136, 127, 0.8)",
              "rgba(96, 125, 139)",
              "rgba(100, 100, 100, 0.8)",
            ][index % 6]
        ),
        borderColor: coursesRevenue.map(
          (_, index) =>
            [
              "rgba(0,0,0,1)",
              "rgba(97, 97, 97, 1)",
              "rgba(161, 136, 127, 1)",
              "rgba(96, 125, 139, 1)",
              "rgba(100, 100, 100, 1)",
            ][index % 6]
        ),
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        categoryPercentage: 0.5,
        barPercentage: 0.6,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const totalRevenue = coursesRevenue
    .map((course) => Number(course.totalRevenue))
    .reduce((acc, currentRevenue) => acc + currentRevenue, 0);

  const totalStudents = coursesRevenue
    .map((course) => Number(course.enrollmentCount))
    .reduce((acc, currentCount) => acc + currentCount, 0);

  const totalCourses = coursesRevenue.map((course) => {
    course.course.id;
  });

  return (
    <div className="container mx-auto flex flex-col px-4">
      <AnalyticsCard
        totalRevenue={totalRevenue}
        totalStudents={totalStudents}
        totalCourses={totalCourses.length}
      />

      <div className="w-full max-w-[90%] mx-auto mt-4">
        <div
          className="relative w-full"
          style={{ height: `${chartHeight}px`, minHeight: "300px" }}
        >
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default BarChart;

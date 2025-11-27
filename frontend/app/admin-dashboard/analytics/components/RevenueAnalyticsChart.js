"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RevenueAnalyticsChart = ({ data }) => {
  const [viewType, setViewType] = useState("daily"); // daily, weekly, monthly

  // Process data for chart
  const processChartData = () => {
    if (!data || !data.revenueByPeriod) {
      // Return sample data if no data available
      const sampleDates = [];
      const sampleRevenue = [];

      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleDates.push(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
        sampleRevenue.push(Math.floor(Math.random() * 5000) + 1000);
      }

      return {
        labels: sampleDates,
        datasets: [
          {
            label: "Daily Revenue",
            data: sampleRevenue,
            backgroundColor: "rgba(34, 197, 94, 0.8)",
            borderColor: "rgb(34, 197, 94)",
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      };
    }

    // Process real data
    const periods = Object.keys(data.revenueByPeriod).sort();
    const labels = periods.map((period) => {
      const date = new Date(period);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    const revenueData = periods.map((period) => data.revenueByPeriod[period]);

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenueData,
          backgroundColor: "rgba(34, 197, 94, 0.8)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `Revenue: $${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value) {
            return `$${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  const chartData = processChartData();

  // Calculate revenue metrics
  const calculateRevenueMetrics = () => {
    if (!data || !data.revenueByPeriod) {
      return {
        totalRevenue: "$125,430",
        averageDaily: "$4,181",
        growthRate: "8.2%",
        topDay: "$6,750",
      };
    }

    const periods = Object.keys(data.revenueByPeriod).sort();
    const revenues = periods.map((period) => data.revenueByPeriod[period]);

    const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue, 0);
    const averageDaily = totalRevenue / revenues.length;
    const topDay = Math.max(...revenues);

    // Calculate growth rate (comparing first half to second half)
    const midPoint = Math.floor(revenues.length / 2);
    const firstHalf = revenues.slice(0, midPoint);
    const secondHalf = revenues.slice(midPoint);

    const firstHalfAvg =
      firstHalf.reduce((sum, rev) => sum + rev, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, rev) => sum + rev, 0) / secondHalf.length;
    const growthRate = (
      ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) *
      100
    ).toFixed(1);

    return {
      totalRevenue: `$${totalRevenue.toLocaleString()}`,
      averageDaily: `$${averageDaily.toLocaleString()}`,
      growthRate: `${growthRate}%`,
      topDay: `$${topDay.toLocaleString()}`,
    };
  };

  const metrics = calculateRevenueMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Revenue Analytics
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewType === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("daily")}
            >
              Daily
            </Button>
            <Button
              variant={viewType === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={viewType === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("monthly")}
            >
              Monthly
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-4">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {metrics.totalRevenue}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {metrics.averageDaily}
            </div>
            <div className="text-sm text-gray-600">Daily Average</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              {metrics.growthRate}
            </div>
            <div className="text-sm text-gray-600">Growth Rate</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {metrics.topDay}
            </div>
            <div className="text-sm text-gray-600">Best Day</div>
          </div>
        </div>

        {/* Revenue Insights */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Revenue Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-600">
                Peak revenue typically occurs on weekends
              </span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-gray-600">
                {parseFloat(metrics.growthRate) > 0 ? "Positive" : "Negative"}{" "}
                growth trend this period
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueAnalyticsChart;

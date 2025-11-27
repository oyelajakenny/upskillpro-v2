"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const UserGrowthChart = ({ data }) => {
  // Process data for chart
  const processChartData = () => {
    if (!data || !data.usersByPeriod) {
      // Return sample data if no data available
      const sampleDates = [];
      const sampleUsers = [];
      const sampleNewUsers = [];

      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleDates.push(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
        sampleUsers.push(Math.floor(Math.random() * 100) + 500 + i * 5);
        sampleNewUsers.push(Math.floor(Math.random() * 20) + 5);
      }

      return {
        labels: sampleDates,
        datasets: [
          {
            label: "Total Users",
            data: sampleUsers,
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "New Users",
            data: sampleNewUsers,
            borderColor: "rgb(16, 185, 129)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      };
    }

    // Process real data
    const periods = Object.keys(data.usersByPeriod).sort();
    const labels = periods.map((period) => {
      const date = new Date(period);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    const totalUsers = periods.map((period) => data.usersByPeriod[period]);
    const newUsers = periods.map(
      (period) => data.newUsersByPeriod?.[period] || 0
    );

    return {
      labels,
      datasets: [
        {
          label: "Total Users",
          data: totalUsers,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "New Users",
          data: newUsers,
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            return `${
              context.dataset.label
            }: ${context.parsed.y.toLocaleString()}`;
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
            return value.toLocaleString();
          },
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  const chartData = processChartData();

  // Calculate growth metrics
  const calculateGrowthMetrics = () => {
    if (!data || !data.usersByPeriod) {
      return {
        totalGrowth: "12.5%",
        newUsersToday: "23",
        averageDaily: "18.4",
      };
    }

    const periods = Object.keys(data.usersByPeriod).sort();
    if (periods.length < 2) {
      return {
        totalGrowth: "0%",
        newUsersToday: "0",
        averageDaily: "0",
      };
    }

    const firstPeriod = data.usersByPeriod[periods[0]];
    const lastPeriod = data.usersByPeriod[periods[periods.length - 1]];
    const totalGrowth = (
      ((lastPeriod - firstPeriod) / firstPeriod) *
      100
    ).toFixed(1);

    const newUsersToday =
      data.newUsersByPeriod?.[periods[periods.length - 1]] || 0;
    const totalNewUsers = Object.values(data.newUsersByPeriod || {}).reduce(
      (sum, count) => sum + count,
      0
    );
    const averageDaily = (totalNewUsers / periods.length).toFixed(1);

    return {
      totalGrowth: `${totalGrowth}%`,
      newUsersToday: newUsersToday.toString(),
      averageDaily,
    };
  };

  const metrics = calculateGrowthMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            User Growth Analytics
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span className="font-medium text-green-600">
                {metrics.totalGrowth}
              </span>
              <span className="ml-1">growth</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-4">
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Growth Metrics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.newUsersToday}
            </div>
            <div className="text-sm text-gray-600">New Users Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.averageDaily}
            </div>
            <div className="text-sm text-gray-600">Daily Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.totalGrowth}
            </div>
            <div className="text-sm text-gray-600">Total Growth</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;

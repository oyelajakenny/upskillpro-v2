"use client";

import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, Target, Users } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const EngagementMetricsChart = ({ data }) => {
  // Process data for radar chart
  const processChartData = () => {
    if (!data) {
      // Return sample engagement data
      return {
        labels: [
          "Course Completion",
          "Daily Active Users",
          "Session Duration",
          "User Retention",
          "Content Interaction",
          "Community Engagement",
        ],
        datasets: [
          {
            label: "Current Period",
            data: [78, 85, 72, 68, 82, 75],
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 2,
            pointBackgroundColor: "rgb(59, 130, 246)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(59, 130, 246)",
          },
          {
            label: "Previous Period",
            data: [65, 78, 68, 62, 75, 70],
            backgroundColor: "rgba(156, 163, 175, 0.2)",
            borderColor: "rgb(156, 163, 175)",
            borderWidth: 2,
            pointBackgroundColor: "rgb(156, 163, 175)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(156, 163, 175)",
          },
        ],
      };
    }

    // Process real data
    const engagementMetrics = {
      courseCompletion: data.courseCompletionRate || 0,
      dailyActiveUsers: data.dailyActiveUsersRate || 0,
      sessionDuration: data.averageSessionDuration || 0,
      userRetention: data.userRetentionRate || 0,
      contentInteraction: data.contentInteractionRate || 0,
      communityEngagement: data.communityEngagementRate || 0,
    };

    return {
      labels: [
        "Course Completion",
        "Daily Active Users",
        "Session Duration",
        "User Retention",
        "Content Interaction",
        "Community Engagement",
      ],
      datasets: [
        {
          label: "Current Period",
          data: Object.values(engagementMetrics),
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
          pointBackgroundColor: "rgb(59, 130, 246)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(59, 130, 246)",
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.r}%`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: function (value) {
            return value + "%";
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        angleLines: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  const chartData = processChartData();

  // Calculate engagement insights
  const calculateEngagementInsights = () => {
    if (!data) {
      return {
        overallScore: "76%",
        topMetric: "Daily Active Users",
        improvementArea: "User Retention",
        trend: "positive",
      };
    }

    const metrics = chartData.datasets[0].data;
    const overallScore = (
      metrics.reduce((sum, value) => sum + value, 0) / metrics.length
    ).toFixed(0);

    const metricNames = chartData.labels;
    const maxIndex = metrics.indexOf(Math.max(...metrics));
    const minIndex = metrics.indexOf(Math.min(...metrics));

    return {
      overallScore: `${overallScore}%`,
      topMetric: metricNames[maxIndex],
      improvementArea: metricNames[minIndex],
      trend: overallScore > 70 ? "positive" : "needs_attention",
    };
  };

  const insights = calculateEngagementInsights();

  // Sample engagement activities data
  const recentActivities = [
    {
      type: "Course Completion",
      count: 45,
      change: "+12%",
      icon: Target,
      color: "text-green-600",
    },
    {
      type: "Active Sessions",
      count: 1247,
      change: "+8%",
      icon: Activity,
      color: "text-blue-600",
    },
    {
      type: "Avg. Session Time",
      count: "24m",
      change: "+5%",
      icon: Clock,
      color: "text-purple-600",
    },
    {
      type: "User Interactions",
      count: 3892,
      change: "+15%",
      icon: Users,
      color: "text-orange-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2 text-purple-600" />
          User Engagement Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="h-64">
            <Radar data={chartData} options={chartOptions} />
          </div>

          {/* Engagement Summary */}
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {insights.overallScore}
              </div>
              <div className="text-sm text-gray-600">
                Overall Engagement Score
              </div>
              <div
                className={`text-xs mt-1 ${
                  insights.trend === "positive"
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {insights.trend === "positive"
                  ? "↗ Trending up"
                  : "⚠ Needs attention"}
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800">
                  Strongest Area
                </div>
                <div className="text-green-600">{insights.topMetric}</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm font-medium text-orange-800">
                  Improvement Opportunity
                </div>
                <div className="text-orange-600">
                  {insights.improvementArea}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Engagement Activities */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-gray-900 mb-4">
            Recent Engagement Activities
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {recentActivities.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg text-center"
                >
                  <IconComponent
                    className={`h-6 w-6 mx-auto mb-2 ${activity.color}`}
                  />
                  <div className="text-lg font-bold text-gray-900">
                    {activity.count}
                  </div>
                  <div className="text-xs text-gray-600">{activity.type}</div>
                  <div className="text-xs text-green-600 mt-1">
                    {activity.change}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Insights */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">
            Engagement Insights
          </h4>
          <div className="text-sm text-purple-800 space-y-1">
            <p>
              • User engagement is{" "}
              {insights.trend === "positive" ? "strong" : "moderate"} with an
              overall score of {insights.overallScore}
            </p>
            <p>
              • {insights.topMetric} shows the highest performance this period
            </p>
            <p>
              • Focus on improving {insights.improvementArea} for better overall
              engagement
            </p>
            <p>• Peak engagement occurs during weekday evenings (6-9 PM)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EngagementMetricsChart;

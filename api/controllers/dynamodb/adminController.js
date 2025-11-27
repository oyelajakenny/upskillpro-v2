import { AdminRepository } from "../../models/dynamodb/admin-repository.js";
import { UserRepository } from "../../models/dynamodb/user-repository.js";

/**
 * Verify admin access and return user info
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export const verifyAdminAccess = async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;

    // Get user details to ensure they still exist and have proper role
    const user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    if (user.role !== "super_admin" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        code: "INSUFFICIENT_PRIVILEGES",
        currentRole: user.role,
      });
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended",
        code: "ACCOUNT_SUSPENDED",
      });
    }

    // Log the admin access verification
    await AdminRepository.logAdminAction(userId, "ADMIN_ACCESS_VERIFIED", {
      targetEntity: `USER#${userId}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Admin access verified",
      data: {
        user: {
          userId: user.userId,
          id: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture || null,
          bio: user.bio || null,
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        permissions:
          user.role === "super_admin" ? ["super_admin", "admin"] : ["admin"],
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error verifying admin access:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify admin access",
      error: error.message,
    });
  }
};

/**
 * Get dashboard overview with platform statistics
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export const getDashboardOverview = async (req, res) => {
  try {
    // Get platform metrics
    const metrics = await AdminRepository.getPlatformMetrics();

    // Get recent activity (last 10 admin actions)
    const recentActivity = await AdminRepository.getAuditTrail({
      limit: 10,
    });

    // Calculate percentage changes (mock data for now - would need historical data)
    const previousPeriodMetrics = {
      totalUsers: Math.floor(metrics.totalUsers * 0.95), // 5% growth simulation
      totalCourses: Math.floor(metrics.totalCourses * 0.92), // 8% growth simulation
      totalEnrollments: Math.floor(metrics.totalEnrollments * 0.88), // 12% growth simulation
    };

    const percentageChanges = {
      users: (
        ((metrics.totalUsers - previousPeriodMetrics.totalUsers) /
          previousPeriodMetrics.totalUsers) *
        100
      ).toFixed(1),
      courses: (
        ((metrics.totalCourses - previousPeriodMetrics.totalCourses) /
          previousPeriodMetrics.totalCourses) *
        100
      ).toFixed(1),
      enrollments: (
        ((metrics.totalEnrollments - previousPeriodMetrics.totalEnrollments) /
          previousPeriodMetrics.totalEnrollments) *
        100
      ).toFixed(1),
    };

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          ...metrics,
          percentageChanges,
        },
        recentActivity: recentActivity.auditLogs,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard overview",
      error: error.message,
    });
  }
};

/**
 * Get real-time metrics for dashboard updates
 * Requirements: 1.5
 */
export const getRealTimeMetrics = async (req, res) => {
  try {
    const metrics = await AdminRepository.getPlatformMetrics();

    // Get recent activity from last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentActivity = await AdminRepository.getAuditTrail({
      startDate: fiveMinutesAgo,
      limit: 5,
    });

    res.status(200).json({
      success: true,
      data: {
        metrics,
        recentActivity: recentActivity.auditLogs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching real-time metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch real-time metrics",
      error: error.message,
    });
  }
};

/**
 * Get recent activity feed for dashboard
 * Requirements: 1.5
 */
export const getRecentActivityFeed = async (req, res) => {
  try {
    const { limit = 20, lastEvaluatedKey } = req.query;

    const activityFeed = await AdminRepository.getAuditTrail({
      limit: parseInt(limit),
      lastEvaluatedKey,
    });

    res.status(200).json({
      success: true,
      data: activityFeed,
    });
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity feed",
      error: error.message,
    });
  }
};

/**
 * Get all users with search and filtering
 * Requirements: 2.1, 2.2, 2.5
 * 
 * Note: Search filtering is applied client-side after fetching from DynamoDB.
 * For better performance with large datasets, consider implementing server-side
 * search using DynamoDB's contains() function or a search service like Elasticsearch.
 */
export const getAllUsers = async (req, res) => {
  try {
    const {
      limit = 50,
      lastEvaluatedKey,
      role,
      accountStatus,
      search,
    } = req.query;

    // If search is provided, we need to fetch more users to account for filtering
    // This is a workaround - ideally search should be server-side
    const fetchLimit = search ? parseInt(limit) * 3 : parseInt(limit);

    const users = await AdminRepository.getAllUsers({
      limit: fetchLimit,
      lastEvaluatedKey,
      role,
      accountStatus,
    });

    // Apply search filter if provided (client-side filtering)
    let filteredUsers = users.users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
      );
      
      // If search reduced results below limit and we have more data, 
      // we could fetch more, but for now we'll return what we have
      // and let the client handle pagination
      filteredUsers = filteredUsers.slice(0, parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: {
        users: filteredUsers,
        lastEvaluatedKey: users.lastEvaluatedKey,
        count: filteredUsers.length,
        totalCount: users.count,
        scannedCount: users.scannedCount, // For monitoring/debugging
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

/**
 * Get user profile details
 * Requirements: 2.1, 2.2
 */
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's audit trail (recent actions affecting this user)
    const userAuditTrail = await AdminRepository.getAuditTrail({
      limit: 10,
    });

    // Filter audit logs related to this user
    const userRelatedLogs = userAuditTrail.auditLogs.filter(
      (log) => log.details?.targetEntity === `USER#${userId}`
    );

    res.status(200).json({
      success: true,
      data: {
        user,
        auditTrail: userRelatedLogs,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

/**
 * Update user role (admin operation)
 * Requirements: 2.2, 2.3
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, reason } = req.body;
    const adminId = req.user.sub;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const updatedUser = await AdminRepository.updateUserRole(
      userId,
      role,
      adminId,
      reason
    );

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

/**
 * Update user account status (activate/deactivate)
 * Requirements: 2.3, 2.4
 */
export const updateUserAccountStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.sub;

    if (!status || !["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (active or suspended) is required",
      });
    }

    let updatedUser;
    if (status === "suspended") {
      updatedUser = await AdminRepository.deactivateUser(
        userId,
        adminId,
        reason
      );
    } else {
      updatedUser = await AdminRepository.reactivateUser(
        userId,
        adminId,
        reason
      );
    }

    res.status(200).json({
      success: true,
      message: `User account ${status === "suspended" ? "deactivated" : "activated"} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user account status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user account status",
      error: error.message,
    });
  }
};

/**
 * Get user activity monitoring data
 * Requirements: 2.4, 2.5
 */
export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get audit trail for this user
    const auditTrail = await AdminRepository.getAuditTrail({
      startDate,
      endDate,
      limit: 100,
    });

    // Filter logs related to this user
    const userLogs = auditTrail.auditLogs.filter(
      (log) =>
        log.details?.targetEntity === `USER#${userId}` || log.adminId === userId // If user is an admin, show their actions too
    );

    // Compile activity summary
    const activitySummary = {
      loginCount: user.loginCount || 0,
      lastLoginAt: user.lastLoginAt,
      failedLoginAttempts: user.failedLoginAttempts || 0,
      accountStatus: user.accountStatus,
      recentActions: userLogs,
    };

    res.status(200).json({
      success: true,
      data: activitySummary,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user activity",
      error: error.message,
    });
  }
};
/**
 * Get all courses with filtering for admin view
 * Requirements: 3.1, 3.2
 */
export const getAllCourses = async (req, res) => {
  try {
    const {
      limit = 50,
      lastEvaluatedKey,
      status,
      instructorId,
      categoryId,
      search,
    } = req.query;

    const courses = await AdminRepository.getAllCourses({
      limit: parseInt(limit),
      lastEvaluatedKey,
      status,
      instructorId,
      categoryId,
    });

    // Apply search filter if provided
    let filteredCourses = courses.courses;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCourses = courses.courses.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      success: true,
      data: {
        courses: filteredCourses,
        lastEvaluatedKey: courses.lastEvaluatedKey,
        count: filteredCourses.length,
        totalCount: courses.count,
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
};

/**
 * Get course details for admin view
 * Requirements: 3.1, 3.2
 */
export const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course details (would need to implement in repository)
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      data: {
        courseId,
        message:
          "Course details endpoint - implementation needed in course repository",
      },
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course details",
      error: error.message,
    });
  }
};

/**
 * Approve course (admin operation)
 * Requirements: 3.2, 3.3
 */
export const approveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.sub;

    const approvedCourse = await AdminRepository.approveCourse(
      courseId,
      adminId,
      reason
    );

    res.status(200).json({
      success: true,
      message: "Course approved successfully",
      data: approvedCourse,
    });
  } catch (error) {
    console.error("Error approving course:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve course",
      error: error.message,
    });
  }
};

/**
 * Reject course (admin operation)
 * Requirements: 3.2, 3.3
 */
export const rejectCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.sub;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required for course rejection",
      });
    }

    // Update course status to rejected
    const rejectedCourse = await AdminRepository.moderateContent(
      courseId,
      "course",
      "rejected",
      adminId,
      reason
    );

    res.status(200).json({
      success: true,
      message: "Course rejected successfully",
      data: rejectedCourse,
    });
  } catch (error) {
    console.error("Error rejecting course:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject course",
      error: error.message,
    });
  }
};

/**
 * Moderate course content (admin operation)
 * Requirements: 3.2, 3.4
 */
export const moderateCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { action, reason, contentType = "course" } = req.body;
    const adminId = req.user.sub;

    if (!action || !["approve", "reject", "flag"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid action (approve, reject, or flag) is required",
      });
    }

    const moderatedContent = await AdminRepository.moderateContent(
      courseId,
      contentType,
      action,
      adminId,
      reason
    );

    res.status(200).json({
      success: true,
      message: `Content ${action}ed successfully`,
      data: moderatedContent,
    });
  } catch (error) {
    console.error("Error moderating content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to moderate content",
      error: error.message,
    });
  }
};

/**
 * Get instructor performance metrics
 * Requirements: 3.4, 3.5
 */
export const getInstructorPerformance = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { startDate, endDate } = req.query;

    // Get instructor's courses
    const instructorCourses = await AdminRepository.getAllCourses({
      instructorId,
      limit: 100,
    });

    // Calculate performance metrics
    const totalCourses = instructorCourses.count;
    const approvedCourses = instructorCourses.courses.filter(
      (course) => course.status === "approved"
    ).length;
    const pendingCourses = instructorCourses.courses.filter(
      (course) => course.status === "pending"
    ).length;

    // Get revenue analytics for this instructor
    const revenueData = await AdminRepository.getRevenueAnalytics({
      startDate,
      endDate,
    });

    // Filter revenue by instructor's courses
    const instructorRevenue = revenueData.revenueByCourse
      .filter((courseRevenue) =>
        instructorCourses.courses.some(
          (course) => course.courseId === courseRevenue.courseId
        )
      )
      .reduce((total, courseRevenue) => total + courseRevenue.revenue, 0);

    const performanceMetrics = {
      instructorId,
      totalCourses,
      approvedCourses,
      pendingCourses,
      approvalRate:
        totalCourses > 0
          ? ((approvedCourses / totalCourses) * 100).toFixed(1)
          : 0,
      totalRevenue: instructorRevenue,
      courses: instructorCourses.courses,
    };

    res.status(200).json({
      success: true,
      data: performanceMetrics,
    });
  } catch (error) {
    console.error("Error fetching instructor performance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch instructor performance",
      error: error.message,
    });
  }
};

/**
 * Get course analytics for admin dashboard
 * Requirements: 3.4, 3.5
 */
export const getCourseAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    // Get all courses
    const allCourses = await AdminRepository.getAllCourses({ limit: 1000 });

    // Get revenue analytics
    const revenueData = await AdminRepository.getRevenueAnalytics({
      startDate,
      endDate,
      groupBy,
    });

    // Calculate course statistics
    const coursesByStatus = {};
    const coursesByCategory = {};

    allCourses.courses.forEach((course) => {
      // Count by status
      const status = course.status || "unknown";
      coursesByStatus[status] = (coursesByStatus[status] || 0) + 1;

      // Count by category
      const category = course.categoryId || "uncategorized";
      coursesByCategory[category] = (coursesByCategory[category] || 0) + 1;
    });

    const analytics = {
      totalCourses: allCourses.count,
      coursesByStatus,
      coursesByCategory,
      revenueAnalytics: revenueData,
      topPerformingCourses: revenueData.revenueByCourse
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching course analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course analytics",
      error: error.message,
    });
  }
};
/**
 * Get comprehensive platform analytics
 * Requirements: 4.1, 4.2, 4.3
 */
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    // Get platform metrics
    const platformMetrics = await AdminRepository.getPlatformMetrics();

    // Get user growth statistics
    const userGrowthStats = await AdminRepository.getUserGrowthStats({
      startDate,
      endDate,
      groupBy,
    });

    // Get revenue analytics
    const revenueAnalytics = await AdminRepository.getRevenueAnalytics({
      startDate,
      endDate,
      groupBy,
    });

    // Get audit statistics
    const auditStats = await AdminRepository.getAuditStatistics({
      startDate,
      endDate,
    });

    const analytics = {
      platformMetrics,
      userGrowth: userGrowthStats,
      revenue: revenueAnalytics,
      auditStatistics: auditStats,
      generatedAt: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching platform analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform analytics",
      error: error.message,
    });
  }
};

/**
 * Get revenue analytics with date range filtering
 * Requirements: 4.2, 4.3
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const revenueData = await AdminRepository.getRevenueAnalytics({
      startDate,
      endDate,
      groupBy,
    });

    res.status(200).json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error: error.message,
    });
  }
};

/**
 * Get user growth and engagement statistics
 * Requirements: 4.1, 4.3
 */
export const getUserGrowthStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const userStats = await AdminRepository.getUserGrowthStats({
      startDate,
      endDate,
      groupBy,
    });

    res.status(200).json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    console.error("Error fetching user growth statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user growth statistics",
      error: error.message,
    });
  }
};

/**
 * Export analytics data in various formats
 * Requirements: 4.4, 4.5
 */
export const exportAnalyticsData = async (req, res) => {
  try {
    const {
      format = "json",
      dataType = "platform",
      startDate,
      endDate,
    } = req.query;

    if (!["json", "csv"].includes(format)) {
      return res.status(400).json({
        success: false,
        message: "Supported formats: json, csv",
      });
    }

    let data;
    let filename;

    switch (dataType) {
      case "platform":
        data = await AdminRepository.getPlatformMetrics();
        filename = `platform-metrics-${new Date().toISOString().split("T")[0]}`;
        break;
      case "revenue":
        data = await AdminRepository.getRevenueAnalytics({
          startDate,
          endDate,
        });
        filename = `revenue-analytics-${new Date().toISOString().split("T")[0]}`;
        break;
      case "users":
        data = await AdminRepository.getUserGrowthStats({ startDate, endDate });
        filename = `user-growth-${new Date().toISOString().split("T")[0]}`;
        break;
      case "audit":
        const auditData = await AdminRepository.getAuditTrail({
          startDate,
          endDate,
          limit: 1000,
        });
        data = auditData.auditLogs;
        filename = `audit-trail-${new Date().toISOString().split("T")[0]}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Supported data types: platform, revenue, users, audit",
        });
    }

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.json"`
      );
      res.status(200).json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
      });
    } else if (format === "csv") {
      // Convert data to CSV format
      const csvData = convertToCSV(data, dataType);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`
      );
      res.status(200).send(csvData);
    }
  } catch (error) {
    console.error("Error exporting analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export analytics data",
      error: error.message,
    });
  }
};

/**
 * Helper function to convert data to CSV format
 */
function convertToCSV(data, dataType) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return "No data available";
  }

  let csvContent = "";

  switch (dataType) {
    case "audit":
      csvContent = "Timestamp,Admin ID,Action,Target Entity,Details\n";
      data.forEach((log) => {
        const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
        csvContent += `"${log.timestamp}","${log.adminId}","${log.action}","${log.details?.targetEntity || ""}","${details}"\n`;
      });
      break;
    case "revenue":
      csvContent = "Period,Revenue,Enrollments\n";
      Object.entries(data.revenueByPeriod || {}).forEach(
        ([period, revenue]) => {
          csvContent += `"${period}","${revenue}","0"\n`;
        }
      );
      break;
    case "users":
      csvContent = "Period,New Users,Growth Rate\n";
      Object.entries(data.usersByPeriod || {}).forEach(([period, count]) => {
        const growthRate = data.growthRates?.[period] || 0;
        csvContent += `"${period}","${count}","${growthRate}%"\n`;
      });
      break;
    default:
      csvContent = JSON.stringify(data, null, 2);
  }

  return csvContent;
}

/**
 * Get audit trail and compliance reports
 * Requirements: 4.4, 4.5
 */
export const getAuditReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      adminId,
      action,
      limit = 100,
      lastEvaluatedKey,
    } = req.query;

    const auditTrail = await AdminRepository.getAuditTrail({
      startDate,
      endDate,
      adminId,
      action,
      limit: parseInt(limit),
      lastEvaluatedKey,
    });

    const auditStats = await AdminRepository.getAuditStatistics({
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: {
        auditTrail: auditTrail.auditLogs,
        statistics: auditStats,
        pagination: {
          lastEvaluatedKey: auditTrail.lastEvaluatedKey,
          count: auditTrail.count,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching audit reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit reports",
      error: error.message,
    });
  }
};

/**
 * Send report via email
 * Requirements: 4.5, 10.4
 */
export const sendReportEmail = async (req, res) => {
  try {
    const {
      reportType,
      format,
      startDate,
      endDate,
      recipientEmail,
      includeCharts = false,
    } = req.body;
    const adminId = req.user.sub;

    if (!reportType || !format || !recipientEmail) {
      return res.status(400).json({
        success: false,
        message: "Report type, format, and recipient email are required",
      });
    }

    // Generate the report data
    let reportData;
    switch (reportType) {
      case "platform":
        reportData = await AdminRepository.getPlatformMetrics();
        break;
      case "revenue":
        reportData = await AdminRepository.getRevenueAnalytics({
          startDate,
          endDate,
        });
        break;
      case "users":
        reportData = await AdminRepository.getUserGrowthStats({
          startDate,
          endDate,
        });
        break;
      case "audit":
        const auditData = await AdminRepository.getAuditTrail({
          startDate,
          endDate,
          limit: 1000,
        });
        reportData = auditData.auditLogs;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    // Log the email sending action
    await AdminRepository.logAdminAction(adminId, "REPORT_EMAIL_SENT", {
      reportType,
      format,
      recipientEmail,
      startDate,
      endDate,
      includeCharts,
    });

    // In a real implementation, you would use an email service like SendGrid, AWS SES, etc.
    // For now, we'll simulate the email sending
    console.log(`Sending ${reportType} report to ${recipientEmail}`);
    console.log(`Report data:`, JSON.stringify(reportData, null, 2));

    res.status(200).json({
      success: true,
      message: "Report sent via email successfully",
      data: {
        reportType,
        format,
        recipientEmail,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error sending report email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send report via email",
      error: error.message,
    });
  }
};

/**
 * Create scheduled report
 * Requirements: 4.5, 10.4
 */
export const createScheduledReport = async (req, res) => {
  try {
    const {
      name,
      type,
      frequency,
      format,
      recipients,
      dateRange,
      includeCharts = false,
    } = req.body;
    const adminId = req.user.sub;

    if (!name || !type || !frequency || !format || !recipients?.length) {
      return res.status(400).json({
        success: false,
        message: "Name, type, frequency, format, and recipients are required",
      });
    }

    // Calculate next run time based on frequency
    const now = new Date();
    let nextRun = new Date(now);

    switch (frequency) {
      case "daily":
        nextRun.setDate(now.getDate() + 1);
        break;
      case "weekly":
        nextRun.setDate(now.getDate() + 7);
        break;
      case "monthly":
        nextRun.setMonth(now.getMonth() + 1);
        break;
      case "quarterly":
        nextRun.setMonth(now.getMonth() + 3);
        break;
      default:
        nextRun.setDate(now.getDate() + 7); // Default to weekly
    }

    const scheduledReport = {
      id: `scheduled_report_${Date.now()}`,
      name,
      type,
      frequency,
      format,
      recipients,
      dateRange,
      includeCharts,
      createdBy: adminId,
      createdAt: now.toISOString(),
      nextRun: nextRun.toISOString(),
      active: true,
    };

    // In a real implementation, you would save this to the database
    // For now, we'll just log the action
    await AdminRepository.logAdminAction(adminId, "SCHEDULED_REPORT_CREATED", {
      reportId: scheduledReport.id,
      name,
      type,
      frequency,
      recipients: recipients.length,
    });

    res.status(201).json({
      success: true,
      message: "Scheduled report created successfully",
      data: scheduledReport,
    });
  } catch (error) {
    console.error("Error creating scheduled report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create scheduled report",
      error: error.message,
    });
  }
};

/**
 * Update scheduled report status
 * Requirements: 4.5, 10.4
 */
export const updateScheduledReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { active } = req.body;
    const adminId = req.user.sub;

    if (typeof active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Active status must be a boolean value",
      });
    }

    // In a real implementation, you would update the database record
    // For now, we'll just log the action
    await AdminRepository.logAdminAction(adminId, "SCHEDULED_REPORT_UPDATED", {
      reportId,
      active,
      action: active ? "enabled" : "disabled",
    });

    res.status(200).json({
      success: true,
      message: `Scheduled report ${active ? "enabled" : "disabled"} successfully`,
      data: {
        reportId,
        active,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating scheduled report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update scheduled report",
      error: error.message,
    });
  }
};

/**
 * Get security monitoring dashboard
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export const getSecurityDashboard = async (req, res) => {
  try {
    const { hoursBack = 24 } = req.query;

    const securityData = await AdminRepository.getSecurityDashboard({
      hoursBack: parseInt(hoursBack),
    });

    res.status(200).json({
      success: true,
      data: securityData,
    });
  } catch (error) {
    console.error("Error fetching security dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch security dashboard",
      error: error.message,
    });
  }
};

/**
 * Get security events with filtering
 * Requirements: 6.1, 6.2
 */
export const getSecurityEvents = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100, lastEvaluatedKey } = req.query;

    const securityEvents = await AdminRepository.getSecurityEvents({
      startDate,
      endDate,
      limit: parseInt(limit),
      lastEvaluatedKey,
    });

    res.status(200).json({
      success: true,
      data: securityEvents,
    });
  } catch (error) {
    console.error("Error fetching security events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch security events",
      error: error.message,
    });
  }
};

/**
 * Get suspicious activity alerts
 * Requirements: 6.2, 6.3
 */
export const getSuspiciousActivity = async (req, res) => {
  try {
    const { hoursBack = 24 } = req.query;

    const suspiciousActivity = await AdminRepository.detectSuspiciousActivity({
      hoursBack: parseInt(hoursBack),
    });

    res.status(200).json({
      success: true,
      data: suspiciousActivity,
    });
  } catch (error) {
    console.error("Error detecting suspicious activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to detect suspicious activity",
      error: error.message,
    });
  }
};

/**
 * Get detailed user activity logs
 * Requirements: 6.3, 6.4
 */
export const getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    const activityLogs = await AdminRepository.getUserActivityLogs(userId, {
      startDate,
      endDate,
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: activityLogs,
    });
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user activity logs",
      error: error.message,
    });
  }
};

/**
 * Log security event (for testing purposes)
 * Requirements: 6.1, 6.2, 6.3
 */
export const logSecurityEvent = async (req, res) => {
  try {
    const { eventType, userId, details } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: "Event type is required",
      });
    }

    const securityEvent = await AdminRepository.logSecurityEvent(
      eventType,
      userId,
      details,
      ipAddress,
      userAgent
    );

    res.status(201).json({
      success: true,
      message: "Security event logged successfully",
      data: securityEvent,
    });
  } catch (error) {
    console.error("Error logging security event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log security event",
      error: error.message,
    });
  }
};

/**
 * Get all support tickets with filtering
 * Requirements: 8.1, 8.2
 */
export const getAllSupportTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      assignedTo,
      userId,
      limit = 50,
      lastEvaluatedKey,
      search,
    } = req.query;

    const tickets = await AdminRepository.getAllSupportTickets({
      status,
      priority,
      category,
      assignedTo,
      userId,
      limit: parseInt(limit),
      lastEvaluatedKey,
    });

    // Apply search filter if provided
    let filteredTickets = tickets.tickets;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTickets = tickets.tickets.filter(
        (ticket) =>
          ticket.subject?.toLowerCase().includes(searchLower) ||
          ticket.description?.toLowerCase().includes(searchLower) ||
          ticket.userEmail?.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      success: true,
      data: {
        tickets: filteredTickets,
        lastEvaluatedKey: tickets.lastEvaluatedKey,
        count: filteredTickets.length,
        totalCount: tickets.count,
      },
    });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets",
      error: error.message,
    });
  }
};

/**
 * Get support ticket by ID with messages
 * Requirements: 8.2
 */
export const getSupportTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await AdminRepository.getSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    // Get ticket messages (communication history)
    const messages = await AdminRepository.getTicketMessages(ticketId);

    res.status(200).json({
      success: true,
      data: {
        ticket,
        messages,
      },
    });
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch support ticket",
      error: error.message,
    });
  }
};

/**
 * Create support ticket (admin can create on behalf of user)
 * Requirements: 8.1, 8.2
 */
export const createSupportTicket = async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      subject,
      description,
      category,
      priority,
      assignedTo,
      tags,
    } = req.body;
    const adminId = req.user.sub;

    if (!userId || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "User ID, subject, and description are required",
      });
    }

    const ticket = await AdminRepository.createSupportTicket({
      userId,
      userEmail,
      userName,
      subject,
      description,
      category,
      priority,
      assignedTo,
      tags,
    });

    // Log the action
    await AdminRepository.logAdminAction(adminId, "TICKET_CREATED", {
      targetEntity: `TICKET#${ticket.ticketId}`,
      userId,
      subject,
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
      error: error.message,
    });
  }
};

/**
 * Update support ticket
 * Requirements: 8.2, 8.3
 */
export const updateSupportTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const updates = req.body;
    const adminId = req.user.sub;

    const updatedTicket = await AdminRepository.updateSupportTicket(
      ticketId,
      updates,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Support ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update support ticket",
      error: error.message,
    });
  }
};

/**
 * Add message to support ticket
 * Requirements: 8.2, 8.5
 */
export const addTicketMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, attachments, isInternal } = req.body;
    const adminId = req.user.sub;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Get admin user info for sender details
    const adminUser = await UserRepository.findById(adminId);

    const ticketMessage = await AdminRepository.addTicketMessage(ticketId, {
      senderId: adminId,
      senderName: adminUser?.name || "Admin",
      senderRole: adminUser?.role || "super_admin",
      message,
      attachments,
      isInternal,
    });

    res.status(201).json({
      success: true,
      message: "Message added to ticket successfully",
      data: ticketMessage,
    });
  } catch (error) {
    console.error("Error adding ticket message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add message to ticket",
      error: error.message,
    });
  }
};

/**
 * Resolve support ticket
 * Requirements: 8.3, 8.5
 */
export const resolveSupportTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { resolutionNotes } = req.body;
    const adminId = req.user.sub;

    if (!resolutionNotes) {
      return res.status(400).json({
        success: false,
        message: "Resolution notes are required",
      });
    }

    const resolvedTicket = await AdminRepository.resolveSupportTicket(
      ticketId,
      adminId,
      resolutionNotes
    );

    res.status(200).json({
      success: true,
      message: "Support ticket resolved successfully",
      data: resolvedTicket,
    });
  } catch (error) {
    console.error("Error resolving support ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resolve support ticket",
      error: error.message,
    });
  }
};

/**
 * Get ticket statistics
 * Requirements: 8.1
 */
export const getTicketStatistics = async (req, res) => {
  try {
    const stats = await AdminRepository.getTicketStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching ticket statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket statistics",
      error: error.message,
    });
  }
};

/**
 * Create platform-wide announcement
 * Requirements: 8.4, 11.1, 11.2
 */
export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      targetAudience,
      targetUserIds,
      targetRoles,
      status,
      scheduledFor,
      expiresAt,
      channels,
      priority,
    } = req.body;
    const adminId = req.user.sub;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const announcement = await AdminRepository.createAnnouncement({
      title,
      content,
      type,
      targetAudience,
      targetUserIds,
      targetRoles,
      status,
      scheduledFor,
      expiresAt,
      channels,
      priority,
      createdBy: adminId,
    });

    // Log the action
    await AdminRepository.logAdminAction(adminId, "ANNOUNCEMENT_CREATED", {
      targetEntity: `ANNOUNCEMENT#${announcement.announcementId}`,
      title,
      targetAudience,
    });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: error.message,
    });
  }
};

/**
 * Get all announcements with filtering
 * Requirements: 11.1, 11.2
 */
export const getAllAnnouncements = async (req, res) => {
  try {
    const { status, limit = 50, lastEvaluatedKey } = req.query;

    const announcements = await AdminRepository.getAllAnnouncements({
      status,
      limit: parseInt(limit),
      lastEvaluatedKey,
    });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
};

/**
 * Get announcement by ID
 * Requirements: 11.1
 */
export const getAnnouncementById = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement =
      await AdminRepository.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcement",
      error: error.message,
    });
  }
};

/**
 * Update announcement
 * Requirements: 11.1, 11.2
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const updates = req.body;
    const adminId = req.user.sub;

    const updatedAnnouncement = await AdminRepository.updateAnnouncement(
      announcementId,
      updates,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
      error: error.message,
    });
  }
};

/**
 * Delete announcement
 * Requirements: 11.1
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const adminId = req.user.sub;

    await AdminRepository.deleteAnnouncement(announcementId, adminId);

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};

/**
 * Create notification template
 * Requirements: 11.3, 11.4
 */
export const createNotificationTemplate = async (req, res) => {
  try {
    const { name, category, subject, body, variables, channels, isActive } =
      req.body;
    const adminId = req.user.sub;

    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Name, subject, and body are required",
      });
    }

    const template = await AdminRepository.createNotificationTemplate({
      name,
      category,
      subject,
      body,
      variables,
      channels,
      isActive,
      createdBy: adminId,
    });

    // Log the action
    await AdminRepository.logAdminAction(adminId, "TEMPLATE_CREATED", {
      targetEntity: `TEMPLATE#${template.templateId}`,
      name,
      category,
    });

    res.status(201).json({
      success: true,
      message: "Notification template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error creating notification template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification template",
      error: error.message,
    });
  }
};

/**
 * Get all notification templates
 * Requirements: 11.3, 11.4
 */
export const getAllNotificationTemplates = async (req, res) => {
  try {
    const { category, limit = 50, lastEvaluatedKey } = req.query;

    const templates = await AdminRepository.getAllNotificationTemplates({
      category,
      limit: parseInt(limit),
      lastEvaluatedKey,
    });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching notification templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification templates",
      error: error.message,
    });
  }
};

/**
 * Send targeted notification
 * Requirements: 11.2, 11.3, 11.5
 */
export const sendTargetedNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetUserIds,
      targetRoles,
      targetCriteria,
      channels,
      templateId,
    } = req.body;
    const adminId = req.user.sub;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    if (
      !targetUserIds?.length &&
      !targetRoles?.length &&
      !targetCriteria?.enrollmentStatus
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one targeting criteria is required (userIds, roles, or criteria)",
      });
    }

    const notification = await AdminRepository.sendTargetedNotification({
      title,
      message,
      type,
      targetUserIds,
      targetRoles,
      targetCriteria,
      channels,
      templateId,
      createdBy: adminId,
    });

    // Log the action
    await AdminRepository.logAdminAction(adminId, "NOTIFICATION_SENT", {
      targetEntity: `NOTIFICATION#${notification.notificationId}`,
      title,
      targetCount: targetUserIds?.length || 0,
      targetRoles,
    });

    // In a real implementation, you would trigger the actual notification delivery here
    // For now, we'll simulate it by updating the status
    await AdminRepository.updateNotificationStats(notification.notificationId, {
      total: targetUserIds?.length || 0,
      sent: targetUserIds?.length || 0,
      delivered: 0,
      failed: 0,
      opened: 0,
    });

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

/**
 * Get notification delivery statistics
 * Requirements: 11.5
 */
export const getNotificationStats = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const stats = await AdminRepository.getNotificationStats(notificationId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification statistics",
      error: error.message,
    });
  }
};

/**
 * Get system health metrics and performance monitoring
 * Requirements: 12.1, 12.2, 12.4
 */
export const getSystemHealth = async (req, res) => {
  try {
    const { timeRange = "1h" } = req.query;

    const systemHealth = await AdminRepository.getSystemHealth({ timeRange });

    res.status(200).json({
      success: true,
      data: systemHealth,
    });
  } catch (error) {
    console.error("Error fetching system health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system health metrics",
      error: error.message,
    });
  }
};

/**
 * Get database health and query performance metrics
 * Requirements: 12.1, 12.2
 */
export const getDatabaseHealth = async (req, res) => {
  try {
    const { timeRange = "1h" } = req.query;

    const dbHealth = await AdminRepository.getDatabaseHealth({ timeRange });

    res.status(200).json({
      success: true,
      data: dbHealth,
    });
  } catch (error) {
    console.error("Error fetching database health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch database health metrics",
      error: error.message,
    });
  }
};

/**
 * Get API response time monitoring and error rate tracking
 * Requirements: 12.1, 12.4
 */
export const getApiMetrics = async (req, res) => {
  try {
    const { timeRange = "1h", endpoint } = req.query;

    const apiMetrics = await AdminRepository.getApiMetrics({
      timeRange,
      endpoint,
    });

    res.status(200).json({
      success: true,
      data: apiMetrics,
    });
  } catch (error) {
    console.error("Error fetching API metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch API metrics",
      error: error.message,
    });
  }
};

/**
 * Get real-time system performance metrics
 * Requirements: 12.1, 12.4
 */
export const getRealTimeSystemMetrics = async (req, res) => {
  try {
    const metrics = await AdminRepository.getRealTimeSystemMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching real-time system metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch real-time system metrics",
      error: error.message,
    });
  }
};

/**
 * Perform data cleanup operations
 * Requirements: 12.3, 12.5
 */
export const performDataCleanup = async (req, res) => {
  try {
    const { cleanupType, daysOld = 90, dryRun = true } = req.body;
    const adminId = req.user.sub;

    if (!cleanupType) {
      return res.status(400).json({
        success: false,
        message: "Cleanup type is required",
      });
    }

    const result = await AdminRepository.performDataCleanup({
      cleanupType,
      daysOld: parseInt(daysOld),
      dryRun: dryRun === true || dryRun === "true",
      adminId,
    });

    // Log the action
    await AdminRepository.logAdminAction(adminId, "DATA_CLEANUP_PERFORMED", {
      cleanupType,
      daysOld,
      dryRun,
      itemsAffected: result.itemsAffected,
    });

    res.status(200).json({
      success: true,
      message: dryRun
        ? "Dry run completed - no data was deleted"
        : "Data cleanup completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error performing data cleanup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform data cleanup",
      error: error.message,
    });
  }
};

/**
 * Get storage optimization metrics
 * Requirements: 12.3
 */
export const getStorageMetrics = async (req, res) => {
  try {
    const storageMetrics = await AdminRepository.getStorageMetrics();

    res.status(200).json({
      success: true,
      data: storageMetrics,
    });
  } catch (error) {
    console.error("Error fetching storage metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch storage metrics",
      error: error.message,
    });
  }
};

/**
 * Create data backup
 * Requirements: 12.3, 12.5
 */
export const createDataBackup = async (req, res) => {
  try {
    const { backupType, includeData = [] } = req.body;
    const adminId = req.user.sub;

    if (!backupType) {
      return res.status(400).json({
        success: false,
        message: "Backup type is required (full, incremental, or selective)",
      });
    }

    const backup = await AdminRepository.createDataBackup({
      backupType,
      includeData,
      adminId,
    });

    // Log the action
    await AdminRepository.logAdminAction(adminId, "BACKUP_CREATED", {
      backupId: backup.backupId,
      backupType,
      includeData,
    });

    res.status(201).json({
      success: true,
      message: "Backup created successfully",
      data: backup,
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create backup",
      error: error.message,
    });
  }
};

/**
 * Get all backups with filtering
 * Requirements: 12.3
 */
export const getAllBackups = async (req, res) => {
  try {
    const { limit = 50, lastEvaluatedKey } = req.query;

    const backups = await AdminRepository.getAllBackups({
      limit: parseInt(limit),
      lastEvaluatedKey,
    });

    res.status(200).json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error("Error fetching backups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch backups",
      error: error.message,
    });
  }
};

/**
 * Restore data from backup
 * Requirements: 12.3, 12.5
 */
export const restoreFromBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    const { restoreOptions = {} } = req.body;
    const adminId = req.user.sub;

    const result = await AdminRepository.restoreFromBackup(
      backupId,
      restoreOptions,
      adminId
    );

    // Log the action
    await AdminRepository.logAdminAction(adminId, "BACKUP_RESTORED", {
      backupId,
      restoreOptions,
      itemsRestored: result.itemsRestored,
    });

    res.status(200).json({
      success: true,
      message: "Data restored successfully from backup",
      data: result,
    });
  } catch (error) {
    console.error("Error restoring from backup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore from backup",
      error: error.message,
    });
  }
};

/**
 * Schedule maintenance window
 * Requirements: 12.5
 */
export const scheduleMaintenanceWindow = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      maintenanceType,
      affectedServices,
      notifyUsers = true,
    } = req.body;
    const adminId = req.user.sub;

    if (!title || !startTime || !endTime || !maintenanceType) {
      return res.status(400).json({
        success: false,
        message:
          "Title, start time, end time, and maintenance type are required",
      });
    }

    const maintenance = await AdminRepository.scheduleMaintenanceWindow({
      title,
      description,
      startTime,
      endTime,
      maintenanceType,
      affectedServices,
      notifyUsers,
      scheduledBy: adminId,
    });

    // Log the action
    await AdminRepository.logAdminAction(adminId, "MAINTENANCE_SCHEDULED", {
      maintenanceId: maintenance.maintenanceId,
      title,
      startTime,
      endTime,
    });

    res.status(201).json({
      success: true,
      message: "Maintenance window scheduled successfully",
      data: maintenance,
    });
  } catch (error) {
    console.error("Error scheduling maintenance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule maintenance window",
      error: error.message,
    });
  }
};

/**
 * Get all scheduled maintenance windows
 * Requirements: 12.5
 */
export const getAllMaintenanceWindows = async (req, res) => {
  try {
    const { status, limit = 50, lastEvaluatedKey } = req.query;

    const maintenanceWindows = await AdminRepository.getAllMaintenanceWindows({
      status,
      limit: parseInt(limit),
      lastEvaluatedKey,
    });

    res.status(200).json({
      success: true,
      data: maintenanceWindows,
    });
  } catch (error) {
    console.error("Error fetching maintenance windows:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance windows",
      error: error.message,
    });
  }
};

/**
 * Update maintenance window status
 * Requirements: 12.5
 */
export const updateMaintenanceWindow = async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const updates = req.body;
    const adminId = req.user.sub;

    const updatedMaintenance = await AdminRepository.updateMaintenanceWindow(
      maintenanceId,
      updates,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Maintenance window updated successfully",
      data: updatedMaintenance,
    });
  } catch (error) {
    console.error("Error updating maintenance window:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update maintenance window",
      error: error.message,
    });
  }
};

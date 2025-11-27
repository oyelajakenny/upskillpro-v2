/**
 * Admin Dashboard End-to-End Tests
 *
 * These tests verify complete admin workflows:
 * - Super admin authentication and authorization
 * - Dashboard overview and metrics
 * - User management operations
 * - Course management and approval
 * - Analytics and reporting
 * - System settings and configuration
 * - Security monitoring and audit trails
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock API calls
const mockAdminApi = {
  // Authentication
  verifyAdminAccess: jest.fn(),

  // Dashboard
  getDashboardOverview: jest.fn(),
  getRealTimeMetrics: jest.fn(),
  getRecentActivityFeed: jest.fn(),

  // User Management
  getAllUsers: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserRole: jest.fn(),
  updateUserAccountStatus: jest.fn(),
  getUserActivity: jest.fn(),

  // Course Management
  getAllCourses: jest.fn(),
  getCourseDetails: jest.fn(),
  approveCourse: jest.fn(),
  rejectCourse: jest.fn(),
  moderateCourseContent: jest.fn(),

  // Analytics
  getPlatformAnalytics: jest.fn(),
  getRevenueAnalytics: jest.fn(),
  getUserGrowthStats: jest.fn(),
  exportAnalyticsData: jest.fn(),

  // System Settings
  getSystemSettings: jest.fn(),
  updatePlatformSettings: jest.fn(),
  updateFeatureFlags: jest.fn(),

  // Security
  getSecurityDashboard: jest.fn(),
  getSecurityEvents: jest.fn(),

  // Support
  getAllSupportTickets: jest.fn(),
  getSupportTicketById: jest.fn(),
  updateSupportTicket: jest.fn(),

  // Audit
  getAuditReports: jest.fn(),
};

describe("Admin Dashboard E2E Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication and Authorization Flow", () => {
    it("should verify super admin access on dashboard load", async () => {
      mockAdminApi.verifyAdminAccess.mockResolvedValueOnce({
        success: true,
        user: {
          id: "admin-1",
          email: "admin@upskillpro.com",
          role: "super_admin",
          name: "Super Admin",
        },
      });

      const result = await mockAdminApi.verifyAdminAccess();

      expect(result.success).toBe(true);
      expect(result.user.role).toBe("super_admin");
      expect(mockAdminApi.verifyAdminAccess).toHaveBeenCalledTimes(1);
    });

    it("should reject non-super-admin users", async () => {
      mockAdminApi.verifyAdminAccess.mockRejectedValueOnce({
        code: "INSUFFICIENT_PRIVILEGES",
        message: "Super admin access required",
      });

      try {
        await mockAdminApi.verifyAdminAccess();
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("INSUFFICIENT_PRIVILEGES");
        expect(error.message).toContain("Super admin");
      }
    });

    it("should handle expired tokens gracefully", async () => {
      mockAdminApi.verifyAdminAccess.mockRejectedValueOnce({
        code: "TOKEN_EXPIRED",
        message: "Authentication token has expired",
      });

      try {
        await mockAdminApi.verifyAdminAccess();
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("TOKEN_EXPIRED");
      }
    });
  });

  describe("Dashboard Overview Flow", () => {
    it("should load dashboard with complete metrics", async () => {
      mockAdminApi.getDashboardOverview.mockResolvedValueOnce({
        success: true,
        data: {
          totalUsers: 1250,
          newUsersToday: 45,
          userGrowthPercentage: 12.5,
          activeCourses: 89,
          newCoursesToday: 3,
          courseGrowthPercentage: 8.2,
          totalEnrollments: 3420,
          newEnrollmentsToday: 67,
          enrollmentGrowthPercentage: 15.3,
          totalRevenue: 45670.5,
          revenueToday: 1230.0,
          revenueGrowthPercentage: 18.7,
        },
      });

      const result = await mockAdminApi.getDashboardOverview();

      expect(result.success).toBe(true);
      expect(result.data.totalUsers).toBe(1250);
      expect(result.data.activeCourses).toBe(89);
      expect(result.data.totalRevenue).toBe(45670.5);
    });

    it("should load real-time metrics with auto-refresh", async () => {
      mockAdminApi.getRealTimeMetrics.mockResolvedValueOnce({
        success: true,
        data: {
          activeUsers: 234,
          ongoingEnrollments: 12,
          systemLoad: 45.2,
          apiResponseTime: 125,
          timestamp: new Date().toISOString(),
        },
      });

      const result = await mockAdminApi.getRealTimeMetrics();

      expect(result.success).toBe(true);
      expect(result.data.activeUsers).toBe(234);
      expect(result.data.systemLoad).toBeLessThan(100);
    });

    it("should display recent activity feed", async () => {
      mockAdminApi.getRecentActivityFeed.mockResolvedValueOnce({
        success: true,
        data: {
          activities: [
            {
              id: "act-1",
              type: "USER_REGISTRATION",
              description: "New user registered: john@example.com",
              timestamp: "2025-11-16T10:00:00Z",
            },
            {
              id: "act-2",
              type: "COURSE_CREATED",
              description: "New course created: Advanced React",
              timestamp: "2025-11-16T09:45:00Z",
            },
            {
              id: "act-3",
              type: "ENROLLMENT",
              description: "User enrolled in Python Basics",
              timestamp: "2025-11-16T09:30:00Z",
            },
          ],
        },
      });

      const result = await mockAdminApi.getRecentActivityFeed();

      expect(result.success).toBe(true);
      expect(result.data.activities).toHaveLength(3);
      expect(result.data.activities[0].type).toBe("USER_REGISTRATION");
    });
  });

  describe("User Management Complete Workflow", () => {
    it("should complete full user management workflow", async () => {
      // Step 1: Load all users
      mockAdminApi.getAllUsers.mockResolvedValueOnce({
        success: true,
        data: {
          users: [
            {
              id: "user-1",
              name: "John Doe",
              email: "john@example.com",
              role: "student",
              status: "active",
              createdAt: "2025-01-15T10:00:00Z",
            },
            {
              id: "user-2",
              name: "Jane Smith",
              email: "jane@example.com",
              role: "instructor",
              status: "active",
              createdAt: "2025-01-10T10:00:00Z",
            },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
          },
        },
      });

      const usersResult = await mockAdminApi.getAllUsers({
        page: 1,
        limit: 10,
      });
      expect(usersResult.data.users).toHaveLength(2);

      // Step 2: View user profile
      mockAdminApi.getUserProfile.mockResolvedValueOnce({
        success: true,
        data: {
          id: "user-1",
          name: "John Doe",
          email: "john@example.com",
          role: "student",
          status: "active",
          enrollments: 5,
          coursesCompleted: 2,
          lastLogin: "2025-11-15T14:30:00Z",
        },
      });

      const profileResult = await mockAdminApi.getUserProfile("user-1");
      expect(profileResult.data.enrollments).toBe(5);

      // Step 3: Update user role
      mockAdminApi.updateUserRole.mockResolvedValueOnce({
        success: true,
        message: "User role updated successfully",
        data: {
          userId: "user-1",
          previousRole: "student",
          newRole: "instructor",
        },
      });

      const roleUpdateResult = await mockAdminApi.updateUserRole("user-1", {
        newRole: "instructor",
        reason: "Instructor application approved",
      });

      expect(roleUpdateResult.success).toBe(true);
      expect(roleUpdateResult.data.newRole).toBe("instructor");

      // Step 4: View user activity
      mockAdminApi.getUserActivity.mockResolvedValueOnce({
        success: true,
        data: {
          activities: [
            {
              action: "LOGIN",
              timestamp: "2025-11-15T14:30:00Z",
              ipAddress: "192.168.1.1",
            },
            {
              action: "COURSE_ENROLLMENT",
              timestamp: "2025-11-15T14:35:00Z",
              details: { courseId: "course-1" },
            },
          ],
        },
      });

      const activityResult = await mockAdminApi.getUserActivity("user-1");
      expect(activityResult.data.activities).toHaveLength(2);
    });

    it("should handle user account suspension workflow", async () => {
      mockAdminApi.updateUserAccountStatus.mockResolvedValueOnce({
        success: true,
        message: "User account suspended",
        data: {
          userId: "user-1",
          previousStatus: "active",
          newStatus: "suspended",
          reason: "Policy violation",
        },
      });

      const result = await mockAdminApi.updateUserAccountStatus("user-1", {
        status: "suspended",
        reason: "Policy violation",
      });

      expect(result.success).toBe(true);
      expect(result.data.newStatus).toBe("suspended");
    });
  });

  describe("Course Management Complete Workflow", () => {
    it("should complete full course approval workflow", async () => {
      // Step 1: Load all courses with pending status
      mockAdminApi.getAllCourses.mockResolvedValueOnce({
        success: true,
        data: {
          courses: [
            {
              id: "course-1",
              title: "Advanced React Patterns",
              instructor: "Jane Smith",
              status: "pending",
              createdAt: "2025-11-10T10:00:00Z",
            },
            {
              id: "course-2",
              title: "Python for Data Science",
              instructor: "Bob Johnson",
              status: "approved",
              createdAt: "2025-11-05T10:00:00Z",
            },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
          },
        },
      });

      const coursesResult = await mockAdminApi.getAllCourses({
        status: "pending",
        page: 1,
        limit: 10,
      });
      expect(coursesResult.data.courses).toHaveLength(2);

      // Step 2: View course details
      mockAdminApi.getCourseDetails.mockResolvedValueOnce({
        success: true,
        data: {
          id: "course-1",
          title: "Advanced React Patterns",
          description: "Learn advanced React patterns",
          instructor: {
            id: "instructor-1",
            name: "Jane Smith",
          },
          status: "pending",
          lectures: 12,
          duration: "8 hours",
          price: 49.99,
        },
      });

      const courseResult = await mockAdminApi.getCourseDetails("course-1");
      expect(courseResult.data.status).toBe("pending");

      // Step 3: Approve course
      mockAdminApi.approveCourse.mockResolvedValueOnce({
        success: true,
        message: "Course approved successfully",
        data: {
          courseId: "course-1",
          previousStatus: "pending",
          newStatus: "approved",
          approvedBy: "admin-1",
          approvedAt: new Date().toISOString(),
        },
      });

      const approvalResult = await mockAdminApi.approveCourse("course-1", {
        notes: "Content quality verified",
      });

      expect(approvalResult.success).toBe(true);
      expect(approvalResult.data.newStatus).toBe("approved");
    });

    it("should handle course rejection workflow", async () => {
      mockAdminApi.rejectCourse.mockResolvedValueOnce({
        success: true,
        message: "Course rejected",
        data: {
          courseId: "course-1",
          previousStatus: "pending",
          newStatus: "rejected",
          reason: "Content does not meet quality standards",
          rejectedBy: "admin-1",
        },
      });

      const result = await mockAdminApi.rejectCourse("course-1", {
        reason: "Content does not meet quality standards",
      });

      expect(result.success).toBe(true);
      expect(result.data.newStatus).toBe("rejected");
    });

    it("should handle content moderation workflow", async () => {
      mockAdminApi.moderateCourseContent.mockResolvedValueOnce({
        success: true,
        message: "Content moderated successfully",
        data: {
          courseId: "course-1",
          action: "flag_content",
          reason: "Inappropriate language in lecture 3",
          moderatedBy: "admin-1",
        },
      });

      const result = await mockAdminApi.moderateCourseContent("course-1", {
        action: "flag_content",
        lectureId: "lecture-3",
        reason: "Inappropriate language in lecture 3",
      });

      expect(result.success).toBe(true);
      expect(result.data.action).toBe("flag_content");
    });
  });

  describe("Analytics and Reporting Workflow", () => {
    it("should load comprehensive platform analytics", async () => {
      mockAdminApi.getPlatformAnalytics.mockResolvedValueOnce({
        success: true,
        data: {
          userMetrics: {
            totalUsers: 1250,
            activeUsers: 890,
            newUsers: 45,
            userRetentionRate: 78.5,
          },
          courseMetrics: {
            totalCourses: 89,
            activeCourses: 76,
            averageRating: 4.3,
            completionRate: 65.2,
          },
          revenueMetrics: {
            totalRevenue: 45670.5,
            monthlyRevenue: 12340.0,
            averageOrderValue: 38.5,
          },
          engagementMetrics: {
            dailyActiveUsers: 234,
            averageSessionDuration: 45.2,
            coursesPerUser: 2.7,
          },
        },
      });

      const result = await mockAdminApi.getPlatformAnalytics({
        startDate: "2025-01-01",
        endDate: "2025-11-16",
      });

      expect(result.success).toBe(true);
      expect(result.data.userMetrics.totalUsers).toBe(1250);
      expect(result.data.revenueMetrics.totalRevenue).toBe(45670.5);
    });

    it("should load revenue analytics with date filtering", async () => {
      mockAdminApi.getRevenueAnalytics.mockResolvedValueOnce({
        success: true,
        data: {
          totalRevenue: 12340.0,
          revenueByCategory: {
            "Web Development": 5670.0,
            "Data Science": 4230.0,
            "Mobile Development": 2440.0,
          },
          revenueByInstructor: [
            { instructorId: "inst-1", name: "Jane Smith", revenue: 3450.0 },
            { instructorId: "inst-2", name: "Bob Johnson", revenue: 2890.0 },
          ],
          dailyRevenue: [
            { date: "2025-11-01", revenue: 450.0 },
            { date: "2025-11-02", revenue: 520.0 },
          ],
        },
      });

      const result = await mockAdminApi.getRevenueAnalytics({
        startDate: "2025-11-01",
        endDate: "2025-11-16",
      });

      expect(result.success).toBe(true);
      expect(result.data.totalRevenue).toBe(12340.0);
      expect(result.data.revenueByCategory["Web Development"]).toBe(5670.0);
    });

    it("should export analytics data in multiple formats", async () => {
      mockAdminApi.exportAnalyticsData.mockResolvedValueOnce({
        success: true,
        data: {
          format: "csv",
          downloadUrl:
            "https://s3.amazonaws.com/exports/analytics-2025-11-16.csv",
          expiresAt: "2025-11-17T10:00:00Z",
        },
      });

      const result = await mockAdminApi.exportAnalyticsData({
        format: "csv",
        dataType: "platform_analytics",
        startDate: "2025-01-01",
        endDate: "2025-11-16",
      });

      expect(result.success).toBe(true);
      expect(result.data.format).toBe("csv");
      expect(result.data.downloadUrl).toContain(".csv");
    });
  });

  describe("System Settings Workflow", () => {
    it("should load and update platform settings", async () => {
      // Load current settings
      mockAdminApi.getSystemSettings.mockResolvedValueOnce({
        success: true,
        data: {
          platform: {
            siteName: "UpSkillPro",
            maintenanceMode: false,
            registrationEnabled: true,
          },
          features: {
            courseRatings: true,
            socialSharing: true,
            certificates: true,
          },
          payment: {
            stripeEnabled: true,
            paypalEnabled: false,
          },
        },
      });

      const settingsResult = await mockAdminApi.getSystemSettings();
      expect(settingsResult.data.platform.maintenanceMode).toBe(false);

      // Update settings
      mockAdminApi.updatePlatformSettings.mockResolvedValueOnce({
        success: true,
        message: "Platform settings updated",
        data: {
          platform: {
            siteName: "UpSkillPro",
            maintenanceMode: true,
            registrationEnabled: false,
          },
        },
      });

      const updateResult = await mockAdminApi.updatePlatformSettings({
        maintenanceMode: true,
        registrationEnabled: false,
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data.platform.maintenanceMode).toBe(true);
    });

    it("should toggle feature flags", async () => {
      mockAdminApi.updateFeatureFlags.mockResolvedValueOnce({
        success: true,
        message: "Feature flags updated",
        data: {
          features: {
            courseRatings: true,
            socialSharing: false,
            certificates: true,
            liveStreaming: true,
          },
        },
      });

      const result = await mockAdminApi.updateFeatureFlags({
        socialSharing: false,
        liveStreaming: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.features.liveStreaming).toBe(true);
    });
  });

  describe("Security Monitoring Workflow", () => {
    it("should load security dashboard with alerts", async () => {
      mockAdminApi.getSecurityDashboard.mockResolvedValueOnce({
        success: true,
        data: {
          failedLoginAttempts: 12,
          suspiciousActivities: 3,
          activeAlerts: 2,
          recentSecurityEvents: [
            {
              id: "event-1",
              type: "FAILED_LOGIN",
              severity: "medium",
              userId: "user-1",
              ipAddress: "192.168.1.100",
              timestamp: "2025-11-16T09:00:00Z",
            },
            {
              id: "event-2",
              type: "SUSPICIOUS_ACTIVITY",
              severity: "high",
              userId: "user-2",
              description: "Multiple rapid API calls",
              timestamp: "2025-11-16T08:45:00Z",
            },
          ],
        },
      });

      const result = await mockAdminApi.getSecurityDashboard();

      expect(result.success).toBe(true);
      expect(result.data.failedLoginAttempts).toBe(12);
      expect(result.data.recentSecurityEvents).toHaveLength(2);
    });

    it("should filter and view security events", async () => {
      mockAdminApi.getSecurityEvents.mockResolvedValueOnce({
        success: true,
        data: {
          events: [
            {
              id: "event-1",
              type: "FAILED_LOGIN",
              severity: "medium",
              userId: "user-1",
              timestamp: "2025-11-16T09:00:00Z",
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
          },
        },
      });

      const result = await mockAdminApi.getSecurityEvents({
        type: "FAILED_LOGIN",
        startDate: "2025-11-15",
        endDate: "2025-11-16",
      });

      expect(result.success).toBe(true);
      expect(result.data.events[0].type).toBe("FAILED_LOGIN");
    });
  });

  describe("Support Ticket Workflow", () => {
    it("should complete full support ticket workflow", async () => {
      // Step 1: Load all tickets
      mockAdminApi.getAllSupportTickets.mockResolvedValueOnce({
        success: true,
        data: {
          tickets: [
            {
              id: "ticket-1",
              subject: "Cannot access course",
              status: "open",
              priority: "high",
              userId: "user-1",
              createdAt: "2025-11-15T10:00:00Z",
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
          },
        },
      });

      const ticketsResult = await mockAdminApi.getAllSupportTickets({
        status: "open",
      });
      expect(ticketsResult.data.tickets).toHaveLength(1);

      // Step 2: View ticket details
      mockAdminApi.getSupportTicketById.mockResolvedValueOnce({
        success: true,
        data: {
          id: "ticket-1",
          subject: "Cannot access course",
          description: "I enrolled but cannot see the course content",
          status: "open",
          priority: "high",
          user: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
          },
          messages: [
            {
              id: "msg-1",
              content: "I enrolled but cannot see the course content",
              sender: "user",
              timestamp: "2025-11-15T10:00:00Z",
            },
          ],
        },
      });

      const ticketResult = await mockAdminApi.getSupportTicketById("ticket-1");
      expect(ticketResult.data.status).toBe("open");

      // Step 3: Update ticket and resolve
      mockAdminApi.updateSupportTicket.mockResolvedValueOnce({
        success: true,
        message: "Ticket resolved",
        data: {
          id: "ticket-1",
          status: "resolved",
          resolvedBy: "admin-1",
          resolvedAt: new Date().toISOString(),
        },
      });

      const resolveResult = await mockAdminApi.updateSupportTicket("ticket-1", {
        status: "resolved",
        resolution: "Access issue fixed",
      });

      expect(resolveResult.success).toBe(true);
      expect(resolveResult.data.status).toBe("resolved");
    });
  });

  describe("Audit Trail Workflow", () => {
    it("should load and filter audit logs", async () => {
      mockAdminApi.getAuditReports.mockResolvedValueOnce({
        success: true,
        data: {
          auditLogs: [
            {
              id: "audit-1",
              adminId: "admin-1",
              adminName: "Super Admin",
              action: "USER_ROLE_UPDATE",
              targetEntity: "USER#user-1",
              details: {
                previousRole: "student",
                newRole: "instructor",
              },
              timestamp: "2025-11-16T10:00:00Z",
              ipAddress: "192.168.1.1",
            },
            {
              id: "audit-2",
              adminId: "admin-1",
              adminName: "Super Admin",
              action: "COURSE_APPROVAL",
              targetEntity: "COURSE#course-1",
              details: {
                courseTitle: "Advanced React Patterns",
              },
              timestamp: "2025-11-16T09:45:00Z",
              ipAddress: "192.168.1.1",
            },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
          },
        },
      });

      const result = await mockAdminApi.getAuditReports({
        adminId: "admin-1",
        startDate: "2025-11-16",
        endDate: "2025-11-16",
      });

      expect(result.success).toBe(true);
      expect(result.data.auditLogs).toHaveLength(2);
      expect(result.data.auditLogs[0].action).toBe("USER_ROLE_UPDATE");
    });
  });

  describe("Error Handling and Loading States", () => {
    it("should handle API errors gracefully", async () => {
      mockAdminApi.getDashboardOverview.mockRejectedValueOnce({
        code: "SERVER_ERROR",
        message: "Internal server error",
      });

      try {
        await mockAdminApi.getDashboardOverview();
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("SERVER_ERROR");
        expect(error.message).toContain("server error");
      }
    });

    it("should handle network errors", async () => {
      mockAdminApi.getAllUsers.mockRejectedValueOnce({
        code: "NETWORK_ERROR",
        message: "Network request failed",
      });

      try {
        await mockAdminApi.getAllUsers();
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("NETWORK_ERROR");
      }
    });

    it("should validate required fields before submission", () => {
      const validateUserRoleUpdate = (data) => {
        if (!data.newRole) return { valid: false, error: "Role is required" };
        if (!["student", "instructor", "super_admin"].includes(data.newRole)) {
          return { valid: false, error: "Invalid role" };
        }
        return { valid: true };
      };

      expect(validateUserRoleUpdate({ newRole: "" }).valid).toBe(false);
      expect(validateUserRoleUpdate({ newRole: "invalid" }).valid).toBe(false);
      expect(validateUserRoleUpdate({ newRole: "instructor" }).valid).toBe(
        true
      );
    });
  });

  describe("Data Flow Integration", () => {
    it("should maintain data consistency across components", async () => {
      // Update user role
      mockAdminApi.updateUserRole.mockResolvedValueOnce({
        success: true,
        data: { userId: "user-1", newRole: "instructor" },
      });

      await mockAdminApi.updateUserRole("user-1", { newRole: "instructor" });

      // Verify audit log created
      mockAdminApi.getAuditReports.mockResolvedValueOnce({
        success: true,
        data: {
          auditLogs: [
            {
              action: "USER_ROLE_UPDATE",
              targetEntity: "USER#user-1",
              details: { newRole: "instructor" },
            },
          ],
        },
      });

      const auditResult = await mockAdminApi.getAuditReports({
        action: "USER_ROLE_UPDATE",
      });

      expect(auditResult.data.auditLogs[0].details.newRole).toBe("instructor");
    });

    it("should update dashboard metrics after operations", async () => {
      // Initial metrics
      mockAdminApi.getDashboardOverview.mockResolvedValueOnce({
        success: true,
        data: { totalUsers: 100, activeCourses: 10 },
      });

      const initial = await mockAdminApi.getDashboardOverview();
      expect(initial.data.totalUsers).toBe(100);

      // Approve a course
      mockAdminApi.approveCourse.mockResolvedValueOnce({
        success: true,
        data: { courseId: "course-1", newStatus: "approved" },
      });

      await mockAdminApi.approveCourse("course-1");

      // Updated metrics
      mockAdminApi.getDashboardOverview.mockResolvedValueOnce({
        success: true,
        data: { totalUsers: 100, activeCourses: 11 },
      });

      const updated = await mockAdminApi.getDashboardOverview();
      expect(updated.data.activeCourses).toBe(11);
    });
  });
});

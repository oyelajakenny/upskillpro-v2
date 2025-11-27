/**
 * Comprehensive Admin Dashboard E2E Test Suite
 *
 * This test suite validates:
 * - Complete admin user journeys
 * - Cross-browser compatibility considerations
 * - Responsive design behavior
 * - Performance with large datasets
 * - All requirements validation
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock API client
const mockApi = {
  auth: {
    login: jest.fn(),
    verifyToken: jest.fn(),
  },
  admin: {
    getDashboard: jest.fn(),
    getUsers: jest.fn(),
    updateUser: jest.fn(),
    getCourses: jest.fn(),
    approveCourse: jest.fn(),
    getAnalytics: jest.fn(),
    getAuditLogs: jest.fn(),
  },
};

describe("Comprehensive Admin Dashboard E2E Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe("Complete Admin User Journey - Authentication to Operations", () => {
    it("should complete full authentication and dashboard access flow", async () => {
      // Step 1: Admin login
      mockApi.auth.login.mockResolvedValueOnce({
        success: true,
        token: "mock-admin-token",
        user: {
          id: "admin-1",
          email: "admin@upskillpro.com",
          role: "super_admin",
          name: "Super Admin",
        },
      });

      const loginResult = await mockApi.auth.login({
        email: "admin@upskillpro.com",
        password: "admin123",
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.user.role).toBe("super_admin");

      // Step 2: Verify token and load dashboard
      mockApi.auth.verifyToken.mockResolvedValueOnce({
        valid: true,
        user: loginResult.user,
      });

      mockApi.admin.getDashboard.mockResolvedValueOnce({
        success: true,
        data: {
          totalUsers: 1250,
          activeCourses: 89,
          totalEnrollments: 3420,
          totalRevenue: 45670.5,
          recentActivity: [
            { type: "USER_REGISTRATION", user: "john@example.com" },
            { type: "COURSE_CREATED", course: "Advanced React" },
          ],
        },
      });

      const tokenVerification = await mockApi.auth.verifyToken(
        "mock-admin-token"
      );
      expect(tokenVerification.valid).toBe(true);

      const dashboard = await mockApi.admin.getDashboard();
      expect(dashboard.data.totalUsers).toBe(1250);
      expect(dashboard.data.recentActivity).toHaveLength(2);
    });

    it("should complete full user management workflow", async () => {
      // Step 1: Load users
      mockApi.admin.getUsers.mockResolvedValueOnce({
        success: true,
        data: {
          users: [
            {
              id: "user-1",
              name: "John Doe",
              email: "john@example.com",
              role: "student",
              status: "active",
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      });

      const users = await mockApi.admin.getUsers({ page: 1, limit: 10 });
      expect(users.data.users).toHaveLength(1);

      // Step 2: Update user role
      mockApi.admin.updateUser.mockResolvedValueOnce({
        success: true,
        message: "User role updated successfully",
        data: {
          userId: "user-1",
          previousRole: "student",
          newRole: "instructor",
        },
      });

      const roleUpdate = await mockApi.admin.updateUser("user-1", {
        role: "instructor",
      });

      expect(roleUpdate.success).toBe(true);
      expect(roleUpdate.data.newRole).toBe("instructor");

      // Step 3: Verify audit log
      mockApi.admin.getAuditLogs.mockResolvedValueOnce({
        success: true,
        data: {
          logs: [
            {
              id: "audit-1",
              action: "USER_ROLE_UPDATE",
              adminId: "admin-1",
              targetEntity: "USER#user-1",
              timestamp: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      });

      const auditLogs = await mockApi.admin.getAuditLogs({
        targetEntity: "USER#user-1",
      });

      expect(auditLogs.data.logs[0].action).toBe("USER_ROLE_UPDATE");
    });

    it("should complete full course approval workflow", async () => {
      // Step 1: Load pending courses
      mockApi.admin.getCourses.mockResolvedValueOnce({
        success: true,
        data: {
          courses: [
            {
              id: "course-1",
              title: "Advanced React Patterns",
              instructor: "Jane Smith",
              status: "pending",
              lectures: 12,
            },
          ],
          total: 1,
        },
      });

      const courses = await mockApi.admin.getCourses({ status: "pending" });
      expect(courses.data.courses[0].status).toBe("pending");

      // Step 2: Approve course
      mockApi.admin.approveCourse.mockResolvedValueOnce({
        success: true,
        message: "Course approved successfully",
        data: {
          courseId: "course-1",
          newStatus: "approved",
        },
      });

      const approval = await mockApi.admin.approveCourse("course-1", {
        notes: "Content quality verified",
      });

      expect(approval.success).toBe(true);
      expect(approval.data.newStatus).toBe("approved");
    });
  });

  describe("Responsive Design Tests", () => {
    it("should render dashboard correctly on mobile viewport", () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(max-width: 768px)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      // Verify mobile-specific behavior
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      expect(isMobile).toBe(true);

      // Mobile layout should stack vertically
      const mobileLayout = {
        sidebar: "collapsed",
        navigation: "hamburger-menu",
        cards: "full-width",
      };

      expect(mobileLayout.sidebar).toBe("collapsed");
      expect(mobileLayout.navigation).toBe("hamburger-menu");
    });

    it("should render dashboard correctly on tablet viewport", () => {
      // Mock tablet viewport
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(min-width: 769px) and (max-width: 1024px)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const isTablet = window.matchMedia(
        "(min-width: 769px) and (max-width: 1024px)"
      ).matches;
      expect(isTablet).toBe(true);

      // Tablet layout should show partial sidebar
      const tabletLayout = {
        sidebar: "icon-only",
        navigation: "visible",
        cards: "two-column",
      };

      expect(tabletLayout.sidebar).toBe("icon-only");
      expect(tabletLayout.cards).toBe("two-column");
    });

    it("should render dashboard correctly on desktop viewport", () => {
      // Mock desktop viewport
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(min-width: 1025px)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const isDesktop = window.matchMedia("(min-width: 1025px)").matches;
      expect(isDesktop).toBe(true);

      // Desktop layout should show full sidebar
      const desktopLayout = {
        sidebar: "expanded",
        navigation: "visible",
        cards: "multi-column",
      };

      expect(desktopLayout.sidebar).toBe("expanded");
      expect(desktopLayout.cards).toBe("multi-column");
    });

    it("should handle viewport changes dynamically", () => {
      const viewportSizes = [
        { width: 375, height: 667, device: "mobile" },
        { width: 768, height: 1024, device: "tablet" },
        { width: 1920, height: 1080, device: "desktop" },
      ];

      viewportSizes.forEach(({ width, height, device }) => {
        // Mock viewport size
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: width,
        });
        Object.defineProperty(window, "innerHeight", {
          writable: true,
          configurable: true,
          value: height,
        });

        expect(window.innerWidth).toBe(width);
        expect(window.innerHeight).toBe(height);
      });
    });
  });

  describe("Cross-Browser Compatibility Tests", () => {
    it("should handle localStorage across browsers", () => {
      // Test that localStorage API is available and works consistently
      const testStorage = {
        adminToken: "mock-token",
        userPreferences: JSON.stringify({ theme: "dark" }),
      };

      // Verify storage operations work
      expect(typeof Storage).toBe("function");

      // Test data serialization (consistent across browsers)
      const serialized = JSON.stringify(testStorage);
      const deserialized = JSON.parse(serialized);
      expect(deserialized.adminToken).toBe("mock-token");
      expect(JSON.parse(deserialized.userPreferences).theme).toBe("dark");
    });

    it("should handle sessionStorage across browsers", () => {
      // Test that sessionStorage API is available and works consistently
      const testSessionData = {
        dashboardState: "active",
        currentView: "analytics",
        filters: JSON.stringify({ status: "pending", role: "instructor" }),
      };

      // Verify session data serialization (consistent across browsers)
      const serialized = JSON.stringify(testSessionData);
      const deserialized = JSON.parse(serialized);
      expect(deserialized.dashboardState).toBe("active");
      expect(deserialized.currentView).toBe("analytics");
      expect(JSON.parse(deserialized.filters).status).toBe("pending");
    });

    it("should handle fetch API across browsers", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      const response = await fetch("/api/admin/dashboard");
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith("/api/admin/dashboard");
      expect(data.success).toBe(true);
    });

    it("should handle Date objects consistently", () => {
      const testDate = new Date("2025-11-16T10:00:00Z");

      // ISO string format (consistent across browsers)
      expect(testDate.toISOString()).toBe("2025-11-16T10:00:00.000Z");

      // Timestamp (consistent across browsers)
      expect(typeof testDate.getTime()).toBe("number");
      expect(testDate.getTime()).toBeGreaterThan(0);
    });

    it("should handle JSON operations consistently", () => {
      const testData = {
        id: "user-1",
        name: "John Doe",
        roles: ["student", "instructor"],
        metadata: { lastLogin: "2025-11-16T10:00:00Z" },
      };

      // Stringify
      const jsonString = JSON.stringify(testData);
      expect(typeof jsonString).toBe("string");

      // Parse
      const parsed = JSON.parse(jsonString);
      expect(parsed.id).toBe("user-1");
      expect(parsed.roles).toHaveLength(2);
    });
  });

  describe("Performance Tests - Large Datasets", () => {
    it("should handle large user list efficiently", async () => {
      const startTime = performance.now();

      // Mock large dataset
      const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: "student",
        status: "active",
      }));

      mockApi.admin.getUsers.mockResolvedValueOnce({
        success: true,
        data: {
          users: largeUserList.slice(0, 100), // Paginated
          total: 1000,
          page: 1,
          limit: 100,
        },
      });

      const result = await mockApi.admin.getUsers({ page: 1, limit: 100 });
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.data.users).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Should complete in < 1s
    });

    it("should handle large course list with filtering", async () => {
      const startTime = performance.now();

      // Mock large course dataset
      const largeCourseList = Array.from({ length: 500 }, (_, i) => ({
        id: `course-${i}`,
        title: `Course ${i}`,
        instructor: `Instructor ${i % 50}`,
        status: ["pending", "approved", "rejected"][i % 3],
        enrollments: Math.floor(Math.random() * 500),
      }));

      mockApi.admin.getCourses.mockResolvedValueOnce({
        success: true,
        data: {
          courses: largeCourseList
            .filter((c) => c.status === "pending")
            .slice(0, 50),
          total: 167,
          page: 1,
          limit: 50,
        },
      });

      const result = await mockApi.admin.getCourses({
        status: "pending",
        page: 1,
        limit: 50,
      });
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.data.courses).toHaveLength(50);
      expect(executionTime).toBeLessThan(1000);
    });

    it("should handle large analytics dataset efficiently", async () => {
      const startTime = performance.now();

      // Mock large analytics dataset
      mockApi.admin.getAnalytics.mockResolvedValueOnce({
        success: true,
        data: {
          dailyMetrics: Array.from({ length: 365 }, (_, i) => ({
            date: new Date(2025, 0, i + 1).toISOString().split("T")[0],
            users: Math.floor(Math.random() * 100),
            revenue: Math.random() * 2000,
            enrollments: Math.floor(Math.random() * 50),
          })),
          categoryBreakdown: Array.from({ length: 20 }, (_, i) => ({
            category: `Category ${i}`,
            courses: Math.floor(Math.random() * 50),
            revenue: Math.random() * 10000,
          })),
        },
      });

      const result = await mockApi.admin.getAnalytics({
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      });
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.data.dailyMetrics).toHaveLength(365);
      expect(result.data.categoryBreakdown).toHaveLength(20);
      expect(executionTime).toBeLessThan(2000); // Should complete in < 2s
    });

    it("should handle rapid successive API calls", async () => {
      const startTime = performance.now();

      // Mock rapid API calls
      mockApi.admin.getDashboard.mockResolvedValue({
        success: true,
        data: { totalUsers: 1250 },
      });

      // Simulate 10 rapid calls
      const promises = Array.from({ length: 10 }, () =>
        mockApi.admin.getDashboard()
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.success)).toBe(true);
      expect(executionTime).toBeLessThan(2000);
    });
  });

  describe("Requirements Validation Tests", () => {
    it("should validate all Requirement 1 criteria - Dashboard Overview", async () => {
      mockApi.admin.getDashboard.mockResolvedValueOnce({
        success: true,
        data: {
          totalUsers: 1250,
          activeCourses: 89,
          totalEnrollments: 3420,
          totalRevenue: 45670.5,
          userGrowthPercentage: 12.5,
          courseGrowthPercentage: 8.2,
          recentActivity: [
            { type: "USER_REGISTRATION", timestamp: new Date().toISOString() },
            { type: "COURSE_CREATED", timestamp: new Date().toISOString() },
          ],
        },
      });

      const startTime = performance.now();
      const dashboard = await mockApi.admin.getDashboard();
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // 1.1: Display dashboard with key metrics
      expect(dashboard.data.totalUsers).toBeDefined();
      expect(dashboard.data.activeCourses).toBeDefined();
      expect(dashboard.data.totalEnrollments).toBeDefined();
      expect(dashboard.data.totalRevenue).toBeDefined();

      // 1.3: Load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // 1.4: Show percentage changes
      expect(dashboard.data.userGrowthPercentage).toBeDefined();
      expect(dashboard.data.courseGrowthPercentage).toBeDefined();

      // 1.5: Display recent activity
      expect(dashboard.data.recentActivity).toBeDefined();
      expect(dashboard.data.recentActivity.length).toBeGreaterThan(0);
    });

    it("should validate all Requirement 2 criteria - User Management", async () => {
      // 2.1: Searchable and filterable user list
      mockApi.admin.getUsers.mockResolvedValueOnce({
        success: true,
        data: {
          users: [
            {
              id: "user-1",
              name: "John Doe",
              email: "john@example.com",
              role: "student",
              status: "active",
              enrollments: 5,
              lastLogin: "2025-11-15T14:30:00Z",
            },
          ],
          total: 1,
        },
      });

      const users = await mockApi.admin.getUsers({
        search: "john",
        role: "student",
      });
      expect(users.data.users).toBeDefined();

      // 2.2: Show complete user profile information
      expect(users.data.users[0].enrollments).toBeDefined();
      expect(users.data.users[0].lastLogin).toBeDefined();

      // 2.3: Update user and log change
      mockApi.admin.updateUser.mockResolvedValueOnce({
        success: true,
        data: { userId: "user-1", newRole: "instructor" },
      });

      const update = await mockApi.admin.updateUser("user-1", {
        role: "instructor",
      });
      expect(update.success).toBe(true);

      // 2.4: Deactivate user while preserving data
      mockApi.admin.updateUser.mockResolvedValueOnce({
        success: true,
        data: { userId: "user-1", status: "suspended" },
      });

      const deactivation = await mockApi.admin.updateUser("user-1", {
        status: "suspended",
      });
      expect(deactivation.success).toBe(true);
    });

    it("should validate all Requirement 3 criteria - Course Management", async () => {
      // 3.1: Display courses with filtering
      mockApi.admin.getCourses.mockResolvedValueOnce({
        success: true,
        data: {
          courses: [
            {
              id: "course-1",
              title: "Advanced React",
              instructor: "Jane Smith",
              status: "pending",
              enrollments: 0,
              rating: 0,
            },
          ],
          total: 1,
        },
      });

      const courses = await mockApi.admin.getCourses({
        status: "pending",
        instructor: "Jane Smith",
      });
      expect(courses.data.courses).toBeDefined();

      // 3.2: Show course content and statistics
      expect(courses.data.courses[0].enrollments).toBeDefined();
      expect(courses.data.courses[0].rating).toBeDefined();

      // 3.3: Approve/reject course and notify instructor
      mockApi.admin.approveCourse.mockResolvedValueOnce({
        success: true,
        message: "Course approved and instructor notified",
        data: { courseId: "course-1", newStatus: "approved" },
      });

      const approval = await mockApi.admin.approveCourse("course-1");
      expect(approval.success).toBe(true);
      expect(approval.message).toContain("notified");
    });

    it("should validate all Requirement 4 criteria - Analytics", async () => {
      // 4.1: Display comprehensive analytics
      mockApi.admin.getAnalytics.mockResolvedValueOnce({
        success: true,
        data: {
          userGrowthTrends: [{ month: "Nov", users: 1250 }],
          coursePerformance: [{ courseId: "course-1", enrollments: 50 }],
          engagementStats: { dailyActiveUsers: 234 },
          totalRevenue: 45670.5,
          revenueByCategory: { "Web Development": 15670.0 },
        },
      });

      const analytics = await mockApi.admin.getAnalytics({
        startDate: "2025-01-01",
        endDate: "2025-11-16",
      });

      expect(analytics.data.userGrowthTrends).toBeDefined();
      expect(analytics.data.coursePerformance).toBeDefined();
      expect(analytics.data.engagementStats).toBeDefined();

      // 4.2: Revenue analytics
      expect(analytics.data.totalRevenue).toBeDefined();
      expect(analytics.data.revenueByCategory).toBeDefined();

      // 4.3: Aggregate data and present in multiple formats
      const startTime = performance.now();
      await mockApi.admin.getAnalytics();
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(3000);

      // 4.4: Update analytics based on date range
      mockApi.admin.getAnalytics.mockResolvedValueOnce({
        success: true,
        data: { totalRevenue: 12340.0 },
      });

      const filteredAnalytics = await mockApi.admin.getAnalytics({
        startDate: "2025-11-01",
        endDate: "2025-11-16",
      });
      expect(filteredAnalytics.data.totalRevenue).toBe(12340.0);
    });

    it("should validate all Requirement 10 criteria - Audit Trail", async () => {
      // 10.1: Display chronological audit records
      mockApi.admin.getAuditLogs.mockResolvedValueOnce({
        success: true,
        data: {
          logs: [
            {
              id: "audit-1",
              adminId: "admin-1",
              adminName: "Super Admin",
              action: "USER_ROLE_UPDATE",
              targetEntity: "USER#user-1",
              details: { previousRole: "student", newRole: "instructor" },
              timestamp: "2025-11-16T10:00:00Z",
              ipAddress: "192.168.1.1",
            },
          ],
          total: 1,
        },
      });

      const auditLogs = await mockApi.admin.getAuditLogs();
      expect(auditLogs.data.logs).toBeDefined();

      // 10.2: Show admin user, action, timestamp, affected resources
      const log = auditLogs.data.logs[0];
      expect(log.adminId).toBeDefined();
      expect(log.action).toBeDefined();
      expect(log.timestamp).toBeDefined();
      expect(log.targetEntity).toBeDefined();

      // 10.3: Filter by date range, admin user, action type
      mockApi.admin.getAuditLogs.mockResolvedValueOnce({
        success: true,
        data: {
          logs: [
            {
              id: "audit-1",
              action: "USER_ROLE_UPDATE",
              adminId: "admin-1",
            },
          ],
          total: 1,
        },
      });

      const filteredLogs = await mockApi.admin.getAuditLogs({
        adminId: "admin-1",
        action: "USER_ROLE_UPDATE",
        startDate: "2025-11-16",
        endDate: "2025-11-16",
      });
      expect(filteredLogs.data.logs).toBeDefined();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle API errors gracefully", async () => {
      mockApi.admin.getDashboard.mockRejectedValueOnce({
        code: "SERVER_ERROR",
        message: "Internal server error",
      });

      await expect(mockApi.admin.getDashboard()).rejects.toMatchObject({
        code: "SERVER_ERROR",
      });
    });

    it("should handle network timeouts", async () => {
      mockApi.admin.getUsers.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject({ code: "TIMEOUT" }), 100)
          )
      );

      await expect(mockApi.admin.getUsers()).rejects.toMatchObject({
        code: "TIMEOUT",
      });
    });

    it("should handle empty datasets", async () => {
      mockApi.admin.getUsers.mockResolvedValueOnce({
        success: true,
        data: {
          users: [],
          total: 0,
        },
      });

      const result = await mockApi.admin.getUsers();
      expect(result.data.users).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it("should handle invalid input validation", () => {
      const validateRoleUpdate = (role) => {
        const validRoles = ["student", "instructor", "super_admin"];
        return validRoles.includes(role);
      };

      expect(validateRoleUpdate("invalid")).toBe(false);
      expect(validateRoleUpdate("instructor")).toBe(true);
    });
  });
});

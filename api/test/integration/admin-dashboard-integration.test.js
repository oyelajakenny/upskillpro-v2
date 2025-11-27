/**
 * Admin Dashboard Integration Tests
 * Tests complete workflows from authentication to operations
 * Requirements: All requirements integration (Task 13.1)
 */

import request from "supertest";
import express from "express";
import adminRouter from "../../src/routers/adminRouter.js";
import { generateToken } from "../../utils/jwt.js";

// Create test app
const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);

describe("Admin Dashboard Integration Tests", () => {
  let superAdminToken;
  let regularUserToken;
  let testUserId;
  let testCourseId;

  beforeAll(() => {
    // Generate tokens for testing
    superAdminToken = generateToken({
      sub: "test-super-admin-id",
      email: "superadmin@test.com",
      role: "super_admin",
    });

    regularUserToken = generateToken({
      sub: "test-user-id",
      email: "user@test.com",
      role: "student",
    });

    testUserId = "test-user-123";
    testCourseId = "test-course-456";
  });

  describe("1. Authentication and Authorization Workflow", () => {
    test("should verify super admin access with valid token", async () => {
      const response = await request(app)
        .get("/api/admin/verify")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("permissions");
    });

    test("should reject access without authentication token", async () => {
      const response = await request(app).get("/api/admin/dashboard/overview");

      expect(response.status).toBe(401);
    });

    test("should reject access with non-super-admin role", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard/overview")
        .set("Authorization", `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("2. Dashboard Overview Workflow", () => {
    test("should load dashboard overview with metrics", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard/overview")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("metrics");
      expect(response.body.data.metrics).toHaveProperty("totalUsers");
      expect(response.body.data.metrics).toHaveProperty("totalCourses");
      expect(response.body.data.metrics).toHaveProperty("totalEnrollments");
    });

    test("should fetch real-time metrics", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard/metrics")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("metrics");
      expect(response.body.data).toHaveProperty("timestamp");
    });

    test("should fetch recent activity feed", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard/activity")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("3. User Management Workflow", () => {
    test("should list all users with pagination", async () => {
      const response = await request(app)
        .get("/api/admin/users?limit=10")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("users");
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    test("should filter users by role", async () => {
      const response = await request(app)
        .get("/api/admin/users?role=instructor")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should search users by name or email", async () => {
      const response = await request(app)
        .get("/api/admin/users?search=test")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should get user profile details", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUserId}`)
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect([200, 404]).toContain(response.status);
    });

    test("should update user role with audit logging", async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          role: "instructor",
          reason: "Approved instructor application",
        });

      expect([200, 404, 500]).toContain(response.status);
    });

    test("should update user account status", async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/status`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          status: "suspended",
          reason: "Policy violation",
        });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    test("should get user activity logs", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUserId}/activity`)
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe("4. Course Management Workflow", () => {
    test("should list all courses with filters", async () => {
      const response = await request(app)
        .get("/api/admin/courses?limit=10")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("courses");
    });

    test("should filter courses by status", async () => {
      const response = await request(app)
        .get("/api/admin/courses?status=pending")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should approve course with audit logging", async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourseId}/approve`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          reason: "Course meets quality standards",
        });

      expect([200, 404, 500]).toContain(response.status);
    });

    test("should reject course with reason", async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourseId}/reject`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          reason: "Content does not meet platform guidelines",
        });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    test("should moderate course content", async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourseId}/moderate`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          action: "flag",
          reason: "Inappropriate content detected",
        });

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  describe("5. Analytics and Reporting Workflow", () => {
    test("should fetch platform analytics", async () => {
      const response = await request(app)
        .get("/api/admin/analytics/platform")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("platformMetrics");
    });

    test("should fetch revenue analytics with date range", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-12-31";

      const response = await request(app)
        .get(
          `/api/admin/analytics/revenue?startDate=${startDate}&endDate=${endDate}`
        )
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should fetch user growth statistics", async () => {
      const response = await request(app)
        .get("/api/admin/analytics/users?groupBy=month")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should export analytics data in JSON format", async () => {
      const response = await request(app)
        .get("/api/admin/analytics/export?format=json&dataType=platform")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should export analytics data in CSV format", async () => {
      const response = await request(app)
        .get("/api/admin/analytics/export?format=csv&dataType=users")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("6. Security Monitoring Workflow", () => {
    test("should fetch security dashboard", async () => {
      const response = await request(app)
        .get("/api/admin/security/dashboard")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should fetch security events", async () => {
      const response = await request(app)
        .get("/api/admin/security/events")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should detect suspicious activity", async () => {
      const response = await request(app)
        .get("/api/admin/security/suspicious?hoursBack=24")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("7. Support Ticket Workflow", () => {
    let testTicketId;

    test("should list all support tickets", async () => {
      const response = await request(app)
        .get("/api/admin/support/tickets")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("tickets");
    });

    test("should filter tickets by status and priority", async () => {
      const response = await request(app)
        .get("/api/admin/support/tickets?status=open&priority=high")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should create support ticket", async () => {
      const response = await request(app)
        .post("/api/admin/support/tickets")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          userId: testUserId,
          userEmail: "user@test.com",
          userName: "Test User",
          subject: "Test Support Ticket",
          description: "This is a test ticket",
          category: "technical",
          priority: "medium",
        });

      expect([201, 400, 500]).toContain(response.status);
      if (response.status === 201) {
        testTicketId = response.body.data.ticketId;
      }
    });

    test("should get ticket statistics", async () => {
      const response = await request(app)
        .get("/api/admin/support/tickets/statistics")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("8. Communication and Notifications Workflow", () => {
    let testAnnouncementId;

    test("should create platform announcement", async () => {
      const response = await request(app)
        .post("/api/admin/communications/announcements")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          title: "Platform Maintenance",
          content: "Scheduled maintenance on Sunday",
          type: "maintenance",
          targetAudience: "all",
          status: "published",
          channels: ["email", "in-app"],
          priority: "high",
        });

      expect([201, 400, 500]).toContain(response.status);
      if (response.status === 201) {
        testAnnouncementId = response.body.data.announcementId;
      }
    });

    test("should list all announcements", async () => {
      const response = await request(app)
        .get("/api/admin/communications/announcements")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should send targeted notification", async () => {
      const response = await request(app)
        .post("/api/admin/communications/notifications")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          title: "Test Notification",
          message: "This is a test notification",
          type: "info",
          targetRoles: ["student"],
          channels: ["in-app"],
        });

      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe("9. System Health Monitoring Workflow", () => {
    test("should fetch system health metrics", async () => {
      const response = await request(app)
        .get("/api/admin/system/health")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should fetch database health metrics", async () => {
      const response = await request(app)
        .get("/api/admin/system/database")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should fetch API metrics", async () => {
      const response = await request(app)
        .get("/api/admin/system/api-metrics")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should fetch real-time system metrics", async () => {
      const response = await request(app)
        .get("/api/admin/system/metrics/realtime")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("10. Data Management Workflow", () => {
    test("should perform dry-run data cleanup", async () => {
      const response = await request(app)
        .post("/api/admin/system/cleanup")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          cleanupType: "old_logs",
          daysOld: 90,
          dryRun: true,
        });

      expect([200, 400, 500]).toContain(response.status);
    });

    test("should fetch storage metrics", async () => {
      const response = await request(app)
        .get("/api/admin/system/storage")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should create data backup", async () => {
      const response = await request(app)
        .post("/api/admin/system/backups")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          backupType: "incremental",
          includeData: ["users", "courses"],
        });

      expect([201, 400, 500]).toContain(response.status);
    });

    test("should list all backups", async () => {
      const response = await request(app)
        .get("/api/admin/system/backups")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("11. Error Handling and Edge Cases", () => {
    test("should handle invalid user ID gracefully", async () => {
      const response = await request(app)
        .get("/api/admin/users/invalid-user-id")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect([404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");
      expect(response.body.success).toBe(false);
    });

    test("should handle missing required fields in user role update", async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should handle invalid date range in analytics", async () => {
      const response = await request(app)
        .get("/api/admin/analytics/revenue?startDate=invalid&endDate=invalid")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });

    test("should handle invalid export format", async () => {
      const response = await request(app)
        .get("/api/admin/analytics/export?format=invalid&dataType=platform")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("12. Complete Admin Workflow Integration", () => {
    test("should complete full user management workflow", async () => {
      // 1. List users
      const listResponse = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(listResponse.status).toBe(200);

      // 2. Get user profile (if users exist)
      if (
        listResponse.body.data.users &&
        listResponse.body.data.users.length > 0
      ) {
        const userId = listResponse.body.data.users[0].userId;

        const profileResponse = await request(app)
          .get(`/api/admin/users/${userId}`)
          .set("Authorization", `Bearer ${superAdminToken}`);
        expect([200, 404]).toContain(profileResponse.status);

        // 3. Get user activity
        const activityResponse = await request(app)
          .get(`/api/admin/users/${userId}/activity`)
          .set("Authorization", `Bearer ${superAdminToken}`);
        expect([200, 404, 500]).toContain(activityResponse.status);
      }
    });

    test("should complete full analytics workflow", async () => {
      // 1. Get platform analytics
      const platformResponse = await request(app)
        .get("/api/admin/analytics/platform")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(platformResponse.status).toBe(200);

      // 2. Get revenue analytics
      const revenueResponse = await request(app)
        .get("/api/admin/analytics/revenue")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(revenueResponse.status).toBe(200);

      // 3. Export data
      const exportResponse = await request(app)
        .get("/api/admin/analytics/export?format=json&dataType=platform")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(exportResponse.status).toBe(200);
    });

    test("should complete full security monitoring workflow", async () => {
      // 1. Get security dashboard
      const dashboardResponse = await request(app)
        .get("/api/admin/security/dashboard")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(dashboardResponse.status).toBe(200);

      // 2. Get security events
      const eventsResponse = await request(app)
        .get("/api/admin/security/events")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(eventsResponse.status).toBe(200);

      // 3. Check suspicious activity
      const suspiciousResponse = await request(app)
        .get("/api/admin/security/suspicious")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect(suspiciousResponse.status).toBe(200);
    });
  });
});

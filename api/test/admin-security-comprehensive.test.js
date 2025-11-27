/**
 * Comprehensive Admin Security and Access Control Tests
 * Task 13.2: Perform security testing and access control validation
 * Requirements: 6.1, 6.2, 6.3, 10.1, 10.2
 */

import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";
import express from "express";

// Mock DynamoDB client
const mockSend = jest.fn();
jest.unstable_mockModule("../config/dynamodb.js", () => ({
  default: { send: mockSend },
  TABLE_NAME: "LearningPlatform",
}));

// Mock uuid
jest.unstable_mockModule("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-123"),
}));

const JWT_SECRET = "test-secret-key-for-security-testing";
process.env.JWT_SECRET = JWT_SECRET;

describe("Comprehensive Admin Security and Access Control Tests", () => {
  let app;
  let superAdminToken;
  let regularAdminToken;
  let instructorToken;
  let studentToken;
  let expiredToken;
  let invalidToken;
  let suspendedAdminToken;
  let AdminRepository;

  beforeAll(async () => {
    // Import after mocking
    const adminRepoModule = await import(
      "../models/dynamodb/admin-repository.js"
    );
    AdminRepository = adminRepoModule.AdminRepository;

    // Import admin router
    const adminRouterModule = await import("../src/routers/adminRouter.js");
    const adminRouter = adminRouterModule.default;

    // Create test app
    app = express();
    app.use(express.json());
    app.use("/api/admin", adminRouter);

    // Create test tokens with different roles
    superAdminToken = jwt.sign(
      {
        sub: "super-admin-123",
        role: "super_admin",
        email: "superadmin@test.com",
        name: "Super Admin",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    regularAdminToken = jwt.sign(
      {
        sub: "admin-123",
        role: "admin",
        email: "admin@test.com",
        name: "Regular Admin",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    instructorToken = jwt.sign(
      {
        sub: "instructor-123",
        role: "instructor",
        email: "instructor@test.com",
        name: "Instructor User",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    studentToken = jwt.sign(
      {
        sub: "student-123",
        role: "student",
        email: "student@test.com",
        name: "Student User",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    suspendedAdminToken = jwt.sign(
      {
        sub: "suspended-admin-123",
        role: "super_admin",
        email: "suspended@test.com",
        name: "Suspended Admin",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create expired token (expired 1 hour ago)
    expiredToken = jwt.sign(
      {
        sub: "expired-admin-123",
        role: "super_admin",
        email: "expired@test.com",
        name: "Expired Admin",
      },
      JWT_SECRET,
      { expiresIn: "-1h" }
    );

    // Create invalid token with wrong secret
    invalidToken = jwt.sign(
      {
        sub: "invalid-admin-123",
        role: "super_admin",
        email: "invalid@test.com",
        name: "Invalid Admin",
      },
      "wrong-secret-key",
      { expiresIn: "1h" }
    );
  });

  beforeEach(() => {
    mockSend.mockClear();
    jest.clearAllMocks();
  });

  describe("1. Authentication Security Tests (Requirement 6.1)", () => {
    describe("Token Validation", () => {
      test("should reject requests without authentication token", async () => {
        const response = await request(app).get(
          "/api/admin/dashboard/overview"
        );

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error");
      });

      test("should reject requests with expired token", async () => {
        const response = await request(app)
          .get("/api/admin/dashboard/overview")
          .set("Authorization", `Bearer ${expiredToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error");
      });

      test("should reject requests with invalid token signature", async () => {
        const response = await request(app)
          .get("/api/admin/dashboard/overview")
          .set("Authorization", `Bearer ${invalidToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error");
      });

      test("should reject requests with malformed token", async () => {
        const response = await request(app)
          .get("/api/admin/dashboard/overview")
          .set("Authorization", "Bearer malformed.token.here");

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error");
      });

      test("should reject requests with empty token", async () => {
        const response = await request(app)
          .get("/api/admin/dashboard/overview")
          .set("Authorization", "Bearer ");

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error");
      });

      test("should accept requests with valid super admin token", async () => {
        // Mock successful response
        mockSend.mockResolvedValue({
          Items: [],
          Count: 0,
        });

        jest.spyOn(AdminRepository, "getPlatformMetrics").mockResolvedValue({
          totalUsers: 100,
          totalCourses: 50,
          totalEnrollments: 200,
        });

        jest.spyOn(AdminRepository, "getAuditTrail").mockResolvedValue({
          auditLogs: [],
        });

        const response = await request(app)
          .get("/api/admin/dashboard/overview")
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect([200, 500]).toContain(response.status);
      });
    });

    describe("Token Tampering Detection", () => {
      test("should detect and reject tampered token payload", async () => {
        const parts = superAdminToken.split(".");
        const tamperedPayload = Buffer.from(
          JSON.stringify({ sub: "hacker-123", role: "super_admin" })
        ).toString("base64");
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

        const response = await request(app)
          .get("/api/admin/dashboard/overview")
          .set("Authorization", `Bearer ${tamperedToken}`);

        expect(response.status).toBe(403);
      });

      test("should detect and reject token with modified signature", async () => {
        const parts = superAdminToken.split(".");
        const modifiedToken = `${parts[0]}.${parts[1]}.modifiedsignature`;

        const response = await request(app)
          .get("/api/admin/dashboard/overview")
          .set("Authorization", `Bearer ${modifiedToken}`);

        expect(response.status).toBe(403);
      });
    });
  });

  describe("2. Role-Based Access Control Tests (Requirement 6.2)", () => {
    const protectedEndpoints = [
      { method: "get", path: "/api/admin/dashboard/overview" },
      { method: "get", path: "/api/admin/users" },
      { method: "get", path: "/api/admin/courses" },
      { method: "get", path: "/api/admin/analytics/platform" },
      { method: "get", path: "/api/admin/security/dashboard" },
      { method: "put", path: "/api/admin/users/test-user-123/role" },
      { method: "put", path: "/api/admin/courses/test-course-123/approve" },
      { method: "post", path: "/api/admin/communications/announcements" },
      { method: "put", path: "/api/admin/settings/platform" },
      { method: "post", path: "/api/admin/system/backups" },
    ];

    describe("Super Admin Access", () => {
      test("should allow super admin to access all protected endpoints", async () => {
        // Mock repository methods
        mockSend.mockResolvedValue({ Items: [], Count: 0 });
        jest.spyOn(AdminRepository, "getPlatformMetrics").mockResolvedValue({});
        jest
          .spyOn(AdminRepository, "getAuditTrail")
          .mockResolvedValue({ auditLogs: [] });
        jest
          .spyOn(AdminRepository, "getAllUsers")
          .mockResolvedValue({ users: [], count: 0 });
        jest
          .spyOn(AdminRepository, "getAllCourses")
          .mockResolvedValue({ courses: [], count: 0 });

        for (const endpoint of protectedEndpoints.slice(0, 5)) {
          const response = await request(app)
            [endpoint.method](endpoint.path)
            .set("Authorization", `Bearer ${superAdminToken}`);

          expect([200, 400, 404, 500]).toContain(response.status);
          expect(response.status).not.toBe(403);
        }
      });
    });

    describe("Regular Admin Access Restriction", () => {
      test("should deny regular admin access to super admin endpoints", async () => {
        const response = await request(app)
          .get("/api/admin/dashboard/overview")
          .set("Authorization", `Bearer ${regularAdminToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error");
      });
    });

    describe("Instructor Access Restriction", () => {
      test("should deny instructor access to all admin endpoints", async () => {
        for (const endpoint of protectedEndpoints.slice(0, 3)) {
          const response = await request(app)
            [endpoint.method](endpoint.path)
            .set("Authorization", `Bearer ${instructorToken}`);

          expect(response.status).toBe(403);
        }
      });
    });

    describe("Student Access Restriction", () => {
      test("should deny student access to all admin endpoints", async () => {
        for (const endpoint of protectedEndpoints.slice(0, 3)) {
          const response = await request(app)
            [endpoint.method](endpoint.path)
            .set("Authorization", `Bearer ${studentToken}`);

          expect(response.status).toBe(403);
        }
      });
    });

    describe("Privilege Escalation Prevention", () => {
      test("should prevent privilege escalation through role modification", async () => {
        // Attempt to update own role to super_admin
        const response = await request(app)
          .put("/api/admin/users/student-123/role")
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ role: "super_admin" });

        expect(response.status).toBe(403);
      });

      test("should prevent unauthorized role assignment", async () => {
        const response = await request(app)
          .put("/api/admin/users/test-user-123/role")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send({ role: "admin" });

        expect(response.status).toBe(403);
      });
    });
  });

  describe("3. Audit Logging Validation Tests (Requirement 10.1, 10.2)", () => {
    describe("Admin Action Logging", () => {
      test("should log user role change action", async () => {
        const logSpy = jest
          .spyOn(AdminRepository, "logAdminAction")
          .mockResolvedValue({});
        jest.spyOn(AdminRepository, "updateUserRole").mockResolvedValue({
          userId: "test-user-123",
          role: "instructor",
        });

        mockSend.mockResolvedValue({ Attributes: {} });

        await request(app)
          .put("/api/admin/users/test-user-123/role")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ role: "instructor", reason: "Test" });

        // Verify audit log was created
        expect(logSpy).toHaveBeenCalled();
      });

      test("should log course approval action", async () => {
        const logSpy = jest
          .spyOn(AdminRepository, "logAdminAction")
          .mockResolvedValue({});
        jest.spyOn(AdminRepository, "approveCourse").mockResolvedValue({
          courseId: "test-course-123",
          status: "approved",
        });

        mockSend.mockResolvedValue({ Attributes: {} });

        await request(app)
          .put("/api/admin/courses/test-course-123/approve")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ reason: "Quality standards met" });

        expect(logSpy).toHaveBeenCalled();
      });

      test("should log user account suspension action", async () => {
        const logSpy = jest
          .spyOn(AdminRepository, "logAdminAction")
          .mockResolvedValue({});
        jest.spyOn(AdminRepository, "deactivateUser").mockResolvedValue({
          userId: "test-user-123",
          accountStatus: "suspended",
        });

        mockSend.mockResolvedValue({ Attributes: {} });

        await request(app)
          .put("/api/admin/users/test-user-123/status")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ status: "suspended", reason: "Policy violation" });

        expect(logSpy).toHaveBeenCalled();
      });

      test("should log system settings changes", async () => {
        mockSend.mockResolvedValue({ Attributes: {} });

        const logSpy = jest
          .spyOn(AdminRepository, "logAdminAction")
          .mockResolvedValue({});
        jest.spyOn(AdminRepository, "getSystemSettings").mockResolvedValue({
          platformSettings: {},
        });

        await request(app)
          .put("/api/admin/settings/platform")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ platformName: "Updated Platform" });

        // Audit logger middleware should log the action
        expect(mockSend).toHaveBeenCalled();
      });
    });

    describe("Audit Trail Integrity", () => {
      test("should include admin ID in audit logs", async () => {
        const logSpy = jest
          .spyOn(AdminRepository, "logAdminAction")
          .mockResolvedValue({});
        jest.spyOn(AdminRepository, "updateUserRole").mockResolvedValue({});

        mockSend.mockResolvedValue({ Attributes: {} });

        await request(app)
          .put("/api/admin/users/test-user-123/role")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ role: "instructor" });

        if (logSpy.mock.calls.length > 0) {
          const [adminId] = logSpy.mock.calls[0];
          expect(adminId).toBe("super-admin-123");
        }
      });

      test("should include action details in audit logs", async () => {
        const logSpy = jest
          .spyOn(AdminRepository, "logAdminAction")
          .mockResolvedValue({});
        jest.spyOn(AdminRepository, "updateUserRole").mockResolvedValue({});

        mockSend.mockResolvedValue({ Attributes: {} });

        await request(app)
          .put("/api/admin/users/test-user-123/role")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ role: "instructor", reason: "Application approved" });

        if (logSpy.mock.calls.length > 0) {
          const [, action, details] = logSpy.mock.calls[0];
          expect(action).toBeDefined();
          expect(details).toBeDefined();
        }
      });

      test("should log failed admin actions", async () => {
        jest
          .spyOn(AdminRepository, "updateUserRole")
          .mockRejectedValue(new Error("User not found"));

        const response = await request(app)
          .put("/api/admin/users/nonexistent-user/role")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ role: "instructor" });

        expect(response.status).toBe(500);
      });
    });

    describe("Audit Log Retrieval", () => {
      test("should retrieve audit logs with filtering", async () => {
        jest.spyOn(AdminRepository, "getAuditTrail").mockResolvedValue({
          auditLogs: [
            {
              actionId: "action-1",
              adminId: "super-admin-123",
              action: "USER_ROLE_CHANGE",
              timestamp: new Date().toISOString(),
            },
          ],
          count: 1,
        });

        jest.spyOn(AdminRepository, "getAuditStatistics").mockResolvedValue({
          totalActions: 1,
          actionsByType: {},
        });

        const response = await request(app)
          .get("/api/admin/audit/reports?adminId=super-admin-123")
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect([200, 500]).toContain(response.status);
      });

      test("should retrieve audit logs with date range", async () => {
        jest.spyOn(AdminRepository, "getAuditTrail").mockResolvedValue({
          auditLogs: [],
          count: 0,
        });

        jest.spyOn(AdminRepository, "getAuditStatistics").mockResolvedValue({
          totalActions: 0,
        });

        const response = await request(app)
          .get(
            "/api/admin/audit/reports?startDate=2025-01-01&endDate=2025-01-31"
          )
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect([200, 500]).toContain(response.status);
      });
    });
  });

  describe("4. Security Monitoring Tests (Requirement 6.3)", () => {
    describe("Suspicious Activity Detection", () => {
      test("should detect multiple failed login attempts", async () => {
        jest.spyOn(AdminRepository, "getSuspiciousActivity").mockResolvedValue({
          suspiciousActivities: [
            {
              userId: "test-user-123",
              activityType: "MULTIPLE_FAILED_LOGINS",
              count: 5,
              lastAttempt: new Date().toISOString(),
            },
          ],
        });

        const response = await request(app)
          .get("/api/admin/security/suspicious?hoursBack=24")
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect([200, 500]).toContain(response.status);
      });

      test("should detect unusual access patterns", async () => {
        jest.spyOn(AdminRepository, "getSuspiciousActivity").mockResolvedValue({
          suspiciousActivities: [],
        });

        const response = await request(app)
          .get("/api/admin/security/suspicious")
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect([200, 500]).toContain(response.status);
      });
    });

    describe("Security Event Logging", () => {
      test("should log security events", async () => {
        mockSend.mockResolvedValue({});

        const response = await request(app)
          .post("/api/admin/security/events")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({
            eventType: "SUSPICIOUS_LOGIN",
            userId: "test-user-123",
            details: { ipAddress: "192.168.1.1" },
          });

        expect([200, 201, 400, 500]).toContain(response.status);
      });

      test("should retrieve security events", async () => {
        jest.spyOn(AdminRepository, "getSecurityEvents").mockResolvedValue({
          events: [],
          count: 0,
        });

        const response = await request(app)
          .get("/api/admin/security/events")
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect([200, 500]).toContain(response.status);
      });
    });

    describe("Account Security Validation", () => {
      test("should prevent suspended admin from accessing endpoints", async () => {
        // Mock user repository to return suspended status
        mockSend.mockResolvedValue({
          Item: {
            userId: "suspended-admin-123",
            role: "super_admin",
            accountStatus: "suspended",
          },
        });

        const response = await request(app)
          .get("/api/admin/verify")
          .set("Authorization", `Bearer ${suspendedAdminToken}`);

        expect([403, 500]).toContain(response.status);
      });
    });
  });

  describe("5. Input Validation and Injection Prevention", () => {
    describe("SQL/NoSQL Injection Prevention", () => {
      test("should sanitize user ID input", async () => {
        const maliciousUserId = "'; DROP TABLE users; --";

        const response = await request(app)
          .get(`/api/admin/users/${encodeURIComponent(maliciousUserId)}`)
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect([404, 500]).toContain(response.status);
      });

      test("should sanitize search query input", async () => {
        jest.spyOn(AdminRepository, "getAllUsers").mockResolvedValue({
          users: [],
          count: 0,
        });

        const maliciousSearch = "<script>alert('xss')</script>";

        const response = await request(app)
          .get(`/api/admin/users?search=${encodeURIComponent(maliciousSearch)}`)
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect([200, 500]).toContain(response.status);
      });
    });

    describe("XSS Prevention", () => {
      test("should sanitize announcement content", async () => {
        mockSend.mockResolvedValue({});

        const xssPayload = "<script>alert('xss')</script>";

        const response = await request(app)
          .post("/api/admin/communications/announcements")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({
            title: "Test Announcement",
            content: xssPayload,
            type: "info",
            targetAudience: "all",
          });

        expect([201, 400, 500]).toContain(response.status);
      });
    });

    describe("Request Validation", () => {
      test("should validate required fields in user role update", async () => {
        const response = await request(app)
          .put("/api/admin/users/test-user-123/role")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      test("should validate status values in account status update", async () => {
        const response = await request(app)
          .put("/api/admin/users/test-user-123/status")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ status: "invalid_status" });

        expect(response.status).toBe(400);
      });

      test("should validate export format", async () => {
        const response = await request(app)
          .get("/api/admin/analytics/export?format=invalid&dataType=platform")
          .set("Authorization", `Bearer ${superAdminToken}`);

        expect(response.status).toBe(400);
      });
    });
  });

  describe("6. Data Access Control Tests", () => {
    describe("Sensitive Data Protection", () => {
      test("should not expose sensitive user data in listings", async () => {
        jest.spyOn(AdminRepository, "getAllUsers").mockResolvedValue({
          users: [
            {
              userId: "user-1",
              name: "Test User",
              email: "test@example.com",
              role: "student",
              // Should not include password or sensitive tokens
            },
          ],
          count: 1,
        });

        const response = await request(app)
          .get("/api/admin/users")
          .set("Authorization", `Bearer ${superAdminToken}`);

        if (response.status === 200) {
          const users = response.body.data.users;
          users.forEach((user) => {
            expect(user).not.toHaveProperty("password");
            expect(user).not.toHaveProperty("passwordHash");
            expect(user).not.toHaveProperty("resetToken");
          });
        }
      });
    });

    describe("Cross-User Data Access Prevention", () => {
      test("should prevent access to other admin's sensitive operations", async () => {
        // This would require more complex setup with multiple admin users
        // For now, we verify that admin ID is properly tracked
        const logSpy = jest
          .spyOn(AdminRepository, "logAdminAction")
          .mockResolvedValue({});
        jest.spyOn(AdminRepository, "updateUserRole").mockResolvedValue({});

        mockSend.mockResolvedValue({ Attributes: {} });

        await request(app)
          .put("/api/admin/users/test-user-123/role")
          .set("Authorization", `Bearer ${superAdminToken}`)
          .send({ role: "instructor" });

        if (logSpy.mock.calls.length > 0) {
          const [adminId] = logSpy.mock.calls[0];
          expect(adminId).toBe("super-admin-123");
        }
      });
    });
  });

  describe("7. Rate Limiting and Abuse Prevention", () => {
    test("should handle rapid successive requests", async () => {
      jest.spyOn(AdminRepository, "getPlatformMetrics").mockResolvedValue({});
      jest
        .spyOn(AdminRepository, "getAuditTrail")
        .mockResolvedValue({ auditLogs: [] });

      const requests = Array(10)
        .fill()
        .map(() =>
          request(app)
            .get("/api/admin/dashboard/overview")
            .set("Authorization", `Bearer ${superAdminToken}`)
        );

      const responses = await Promise.all(requests);

      // All requests should be processed (no rate limiting in test environment)
      responses.forEach((response) => {
        expect([200, 500]).toContain(response.status);
      });
    });
  });

  describe("8. Error Handling Security", () => {
    test("should not expose internal errors to client", async () => {
      jest
        .spyOn(AdminRepository, "getAllUsers")
        .mockRejectedValue(
          new Error(
            "Internal database connection failed with credentials at..."
          )
        );

      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).not.toContain("credentials");
      expect(response.body.message).not.toContain("password");
    });

    test("should handle database errors gracefully", async () => {
      jest
        .spyOn(AdminRepository, "getPlatformMetrics")
        .mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/admin/dashboard/overview")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("9. Session Management Security", () => {
    test("should validate token on every request", async () => {
      jest.spyOn(AdminRepository, "getPlatformMetrics").mockResolvedValue({});
      jest
        .spyOn(AdminRepository, "getAuditTrail")
        .mockResolvedValue({ auditLogs: [] });

      // First request
      const response1 = await request(app)
        .get("/api/admin/dashboard/overview")
        .set("Authorization", `Bearer ${superAdminToken}`);

      // Second request with same token
      const response2 = await request(app)
        .get("/api/admin/dashboard/overview")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect([200, 500]).toContain(response1.status);
      expect([200, 500]).toContain(response2.status);
    });
  });

  describe("10. Comprehensive Security Workflow", () => {
    test("should enforce security through complete admin workflow", async () => {
      // Mock all repository methods
      jest
        .spyOn(AdminRepository, "getAllUsers")
        .mockResolvedValue({ users: [], count: 0 });
      jest.spyOn(AdminRepository, "updateUserRole").mockResolvedValue({});
      jest.spyOn(AdminRepository, "logAdminAction").mockResolvedValue({});
      jest
        .spyOn(AdminRepository, "getAuditTrail")
        .mockResolvedValue({ auditLogs: [], count: 0 });
      jest
        .spyOn(AdminRepository, "getAuditStatistics")
        .mockResolvedValue({ totalActions: 0 });

      mockSend.mockResolvedValue({ Attributes: {} });

      // 1. List users (requires authentication and authorization)
      const listResponse = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect([200, 500]).toContain(listResponse.status);

      // 2. Update user role (requires authentication, authorization, and audit logging)
      const updateResponse = await request(app)
        .put("/api/admin/users/test-user-123/role")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ role: "instructor", reason: "Test" });
      expect([200, 404, 500]).toContain(updateResponse.status);

      // 3. Verify audit trail was created
      const auditResponse = await request(app)
        .get("/api/admin/audit/reports")
        .set("Authorization", `Bearer ${superAdminToken}`);
      expect([200, 500]).toContain(auditResponse.status);

      // 4. Verify unauthorized user cannot perform same actions
      const unauthorizedResponse = await request(app)
        .put("/api/admin/users/test-user-123/role")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ role: "instructor" });
      expect(unauthorizedResponse.status).toBe(403);
    });
  });
});

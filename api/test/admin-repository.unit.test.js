import { jest } from "@jest/globals";

// Create mock send function
const mockSend = jest.fn();

// Mock DynamoDB client before importing
jest.unstable_mockModule("../config/dynamodb.js", () => ({
  default: {
    send: mockSend,
  },
  TABLE_NAME: "LearningPlatform",
}));

// Mock uuid
jest.unstable_mockModule("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-123"),
}));

// Import after mocking
const { AdminRepository } = await import(
  "../models/dynamodb/admin-repository.js"
);
const { ScanCommand, UpdateCommand, GetCommand, PutCommand, QueryCommand } =
  await import("@aws-sdk/lib-dynamodb");

describe("AdminRepository Unit Tests", () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  describe("getAllUsers", () => {
    it("should get all users with default pagination", async () => {
      const mockUsers = [
        { userId: "user-1", role: "student", accountStatus: "active" },
        { userId: "user-2", role: "instructor", accountStatus: "active" },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockUsers,
        Count: 2,
      });

      const result = await AdminRepository.getAllUsers();

      expect(mockSend).toHaveBeenCalledWith(expect.any(ScanCommand));
      expect(result.users).toEqual(mockUsers);
      expect(result.count).toBe(2);
    });

    it("should filter users by role", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
      });

      await AdminRepository.getAllUsers({ role: "instructor" });

      const callArgs = mockSend.mock.calls[0][0].input;
      expect(callArgs.FilterExpression).toContain("#role = :role");
      expect(callArgs.ExpressionAttributeValues[":role"]).toBe("instructor");
    });

    it("should filter users by account status", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
      });

      await AdminRepository.getAllUsers({ accountStatus: "suspended" });

      const callArgs = mockSend.mock.calls[0][0].input;
      expect(callArgs.FilterExpression).toContain(
        "accountStatus = :accountStatus"
      );
      expect(callArgs.ExpressionAttributeValues[":accountStatus"]).toBe(
        "suspended"
      );
    });
  });

  describe("updateUserRole", () => {
    it("should update user role and log the action", async () => {
      const currentUser = {
        Item: { userId: "user-123", role: "student" },
      };
      const updatedUser = {
        Attributes: { userId: "user-123", role: "instructor" },
      };

      mockSend
        .mockResolvedValueOnce(currentUser) // Get current user
        .mockResolvedValueOnce(updatedUser) // Update user
        .mockResolvedValueOnce({}); // Log action

      const result = await AdminRepository.updateUserRole(
        "user-123",
        "instructor",
        "admin-456",
        "Approved instructor application"
      );

      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(GetCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(UpdateCommand));
      expect(mockSend).toHaveBeenNthCalledWith(3, expect.any(PutCommand));
      expect(result).toEqual(updatedUser.Attributes);
    });
  });

  describe("deactivateUser", () => {
    it("should deactivate user and log the action", async () => {
      const updatedUser = {
        Attributes: { userId: "user-123", accountStatus: "suspended" },
      };

      mockSend
        .mockResolvedValueOnce(updatedUser) // Update user
        .mockResolvedValueOnce({}); // Log action

      const result = await AdminRepository.deactivateUser(
        "user-123",
        "admin-456",
        "Violation of terms"
      );

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(UpdateCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(PutCommand));
      expect(result).toEqual(updatedUser.Attributes);
    });
  });

  describe("getAllCourses", () => {
    it("should get all courses with default pagination", async () => {
      const mockCourses = [
        { courseId: "course-1", title: "Course 1", status: "approved" },
        { courseId: "course-2", title: "Course 2", status: "pending" },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockCourses,
        Count: 2,
      });

      const result = await AdminRepository.getAllCourses();

      expect(mockSend).toHaveBeenCalledWith(expect.any(ScanCommand));
      expect(result.courses).toEqual(mockCourses);
      expect(result.count).toBe(2);
    });

    it("should filter courses by status", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
      });

      await AdminRepository.getAllCourses({ status: "pending" });

      const callArgs = mockSend.mock.calls[0][0].input;
      expect(callArgs.FilterExpression).toContain("#status = :status");
      expect(callArgs.ExpressionAttributeValues[":status"]).toBe("pending");
    });
  });

  describe("approveCourse", () => {
    it("should approve course and log the action", async () => {
      const updatedCourse = {
        Attributes: { courseId: "course-123", status: "approved" },
      };

      mockSend
        .mockResolvedValueOnce(updatedCourse) // Update course
        .mockResolvedValueOnce({}); // Log action

      const result = await AdminRepository.approveCourse(
        "course-123",
        "admin-456",
        "Course meets quality standards"
      );

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(UpdateCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(PutCommand));
      expect(result).toEqual(updatedCourse.Attributes);
    });
  });

  describe("moderateContent", () => {
    it("should moderate course content and log the action", async () => {
      const updatedContent = {
        Attributes: { courseId: "course-123", moderationStatus: "approved" },
      };

      mockSend
        .mockResolvedValueOnce(updatedContent) // Update content
        .mockResolvedValueOnce({}); // Log action

      const result = await AdminRepository.moderateContent(
        "course-123",
        "course",
        "approved",
        "admin-456",
        "Content is appropriate"
      );

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(UpdateCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(PutCommand));
      expect(result).toEqual(updatedContent.Attributes);
    });

    it("should throw error for unsupported content type", async () => {
      await expect(
        AdminRepository.moderateContent(
          "content-123",
          "unsupported",
          "approve",
          "admin-456"
        )
      ).rejects.toThrow("Unsupported content type: unsupported");
    });
  });

  describe("getPlatformMetrics", () => {
    it("should calculate platform metrics", async () => {
      // Mock responses for each role count
      mockSend
        .mockResolvedValueOnce({ Count: 100 }) // students
        .mockResolvedValueOnce({ Count: 20 }) // instructors
        .mockResolvedValueOnce({ Count: 5 }) // admins
        .mockResolvedValueOnce({ Count: 1 }) // super_admins
        .mockResolvedValueOnce({ Count: 50 }) // courses
        .mockResolvedValueOnce({ Count: 200 }); // enrollments

      const result = await AdminRepository.getPlatformMetrics();

      expect(result.totalUsers).toBe(126);
      expect(result.usersByRole.student).toBe(100);
      expect(result.usersByRole.instructor).toBe(20);
      expect(result.totalCourses).toBe(50);
      expect(result.totalEnrollments).toBe(200);
      expect(result.generatedAt).toBeDefined();
    });
  });

  describe("logAdminAction", () => {
    it("should log admin action with all details", async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await AdminRepository.logAdminAction(
        "admin-123",
        "USER_ROLE_CHANGE",
        {
          targetEntity: "USER#user-456",
          previousValue: "student",
          newValue: "instructor",
          reason: "Approved application",
        },
        "192.168.1.1",
        "Mozilla/5.0"
      );

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
      expect(result.adminId).toBe("admin-123");
      expect(result.action).toBe("USER_ROLE_CHANGE");
      expect(result.details.targetEntity).toBe("USER#user-456");
      expect(result.ipAddress).toBe("192.168.1.1");
    });
  });

  describe("getAuditTrail", () => {
    it("should get audit trail for specific admin", async () => {
      const mockAuditLogs = [
        { actionId: "action-1", action: "USER_ROLE_CHANGE" },
        { actionId: "action-2", action: "COURSE_APPROVAL" },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockAuditLogs,
        Count: 2,
      });

      const result = await AdminRepository.getAuditTrail({
        adminId: "admin-123",
      });

      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(result.auditLogs).toEqual(mockAuditLogs);
      expect(result.count).toBe(2);
    });

    it("should get all audit logs when no admin specified", async () => {
      const mockAuditLogs = [
        { actionId: "action-1", adminId: "admin-1" },
        { actionId: "action-2", adminId: "admin-2" },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockAuditLogs,
        Count: 2,
      });

      const result = await AdminRepository.getAuditTrail();

      expect(mockSend).toHaveBeenCalledWith(expect.any(ScanCommand));
      expect(result.auditLogs).toEqual(mockAuditLogs);
    });
  });

  describe("getRevenueAnalytics", () => {
    it("should calculate revenue analytics", async () => {
      const mockEnrollments = [
        {
          courseId: "course-1",
          courseName: "Course 1",
          paymentAmount: 100,
          createdAt: "2025-01-15T10:00:00Z",
        },
        {
          courseId: "course-2",
          courseName: "Course 2",
          paymentAmount: 150,
          createdAt: "2025-01-15T11:00:00Z",
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockEnrollments,
      });

      const result = await AdminRepository.getRevenueAnalytics();

      expect(result.totalRevenue).toBe(250);
      expect(result.totalEnrollments).toBe(2);
      expect(result.averageRevenuePerEnrollment).toBe(125);
      expect(result.revenueByPeriod["2025-01-15"]).toBe(250);
    });
  });

  describe("getUserGrowthStats", () => {
    it("should calculate user growth statistics", async () => {
      const mockUsers = [
        {
          userId: "user-1",
          role: "student",
          createdAt: "2025-01-15T10:00:00Z",
        },
        {
          userId: "user-2",
          role: "instructor",
          createdAt: "2025-01-15T11:00:00Z",
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockUsers,
      });

      const result = await AdminRepository.getUserGrowthStats();

      expect(result.totalUsers).toBe(2);
      expect(result.usersByRole.student).toBe(1);
      expect(result.usersByRole.instructor).toBe(1);
      expect(result.usersByPeriod["2025-01-15"]).toBe(2);
    });
  });
});

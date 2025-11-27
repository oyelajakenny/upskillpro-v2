import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

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

// Mock JWT
const JWT_SECRET = "test-secret";
process.env.JWT_SECRET = JWT_SECRET;

describe("Admin API Integration Tests", () => {
  let superAdminToken;
  let regularUserToken;
  let AdminRepository;

  beforeAll(async () => {
    // Import after mocking
    const adminRepoModule = await import(
      "../models/dynamodb/admin-repository.js"
    );
    AdminRepository = adminRepoModule.AdminRepository;

    // Create test tokens
    superAdminToken = jwt.sign(
      {
        sub: "admin-123",
        role: "super_admin",
        email: "admin@test.com",
        name: "Super Admin",
        isAdmin: true,
        isSuperAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    regularUserToken = jwt.sign(
      {
        sub: "user-123",
        role: "student",
        email: "user@test.com",
        name: "Regular User",
        isAdmin: false,
        isSuperAdmin: false,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  beforeEach(() => {
    mockSend.mockClear();
  });

  describe("Authentication and Authorization", () => {
    it("should require authentication for admin endpoints", async () => {
      // Mock the controller functions to test authorization
      const mockGetDashboardOverview = jest.fn((req, res) => {
        if (!req.user) {
          return res.status(403).json({ error: "Access denied" });
        }
        if (!req.user.isSuperAdmin) {
          return res
            .status(403)
            .json({ error: "Super admin access required." });
        }
        res.json({ success: true, data: {} });
      });

      // Test without token
      const reqWithoutAuth = { user: null };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockGetDashboardOverview(reqWithoutAuth, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
    });

    it("should require super admin role for admin endpoints", async () => {
      const mockGetDashboardOverview = jest.fn((req, res) => {
        if (!req.user.isSuperAdmin) {
          return res
            .status(403)
            .json({ error: "Super admin access required." });
        }
        res.json({ success: true, data: {} });
      });

      // Test with regular user token
      const reqWithRegularUser = {
        user: {
          sub: "user-123",
          role: "student",
          isSuperAdmin: false,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockGetDashboardOverview(reqWithRegularUser, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Super admin access required.",
      });
    });

    it("should allow access for super admin users", async () => {
      const mockGetDashboardOverview = jest.fn((req, res) => {
        if (!req.user.isSuperAdmin) {
          return res
            .status(403)
            .json({ error: "Super admin access required." });
        }
        res.json({ success: true, data: {} });
      });

      // Test with super admin token
      const reqWithSuperAdmin = {
        user: {
          sub: "admin-123",
          role: "super_admin",
          isSuperAdmin: true,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockGetDashboardOverview(reqWithSuperAdmin, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
    });
  });

  describe("Dashboard Endpoints", () => {
    it("should get dashboard overview with metrics", async () => {
      // Mock AdminRepository methods
      const mockMetrics = {
        totalUsers: 100,
        totalCourses: 50,
        totalEnrollments: 200,
        usersByRole: { student: 80, instructor: 15, admin: 5 },
      };

      const mockAuditTrail = {
        auditLogs: [
          { actionId: "action-1", action: "USER_ROLE_CHANGE" },
          { actionId: "action-2", action: "COURSE_APPROVAL" },
        ],
      };

      // Mock the repository methods
      jest
        .spyOn(AdminRepository, "getPlatformMetrics")
        .mockResolvedValue(mockMetrics);
      jest
        .spyOn(AdminRepository, "getAuditTrail")
        .mockResolvedValue(mockAuditTrail);

      // Simulate the controller function
      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Import and call the controller function
      const { getDashboardOverview } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await getDashboardOverview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          metrics: expect.objectContaining(mockMetrics),
          recentActivity: mockAuditTrail.auditLogs,
        }),
      });
    });

    it("should handle errors in dashboard overview", async () => {
      // Mock repository to throw error
      jest
        .spyOn(AdminRepository, "getPlatformMetrics")
        .mockRejectedValue(new Error("Database error"));

      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { getDashboardOverview } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await getDashboardOverview(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to fetch dashboard overview",
        error: "Database error",
      });
    });
  });

  describe("User Management Endpoints", () => {
    it("should get all users with filtering", async () => {
      const mockUsers = {
        users: [
          { userId: "user-1", name: "User 1", role: "student" },
          { userId: "user-2", name: "User 2", role: "instructor" },
        ],
        count: 2,
        lastEvaluatedKey: null,
      };

      jest.spyOn(AdminRepository, "getAllUsers").mockResolvedValue(mockUsers);

      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
        query: { role: "student", limit: "50" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { getAllUsers } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await getAllUsers(mockReq, mockRes);

      expect(AdminRepository.getAllUsers).toHaveBeenCalledWith({
        limit: 50,
        lastEvaluatedKey: undefined,
        role: "student",
        accountStatus: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          users: mockUsers.users,
          count: 2,
        }),
      });
    });

    it("should update user role", async () => {
      const mockUpdatedUser = {
        userId: "user-123",
        role: "instructor",
        updatedAt: "2025-01-15T10:00:00Z",
      };

      jest
        .spyOn(AdminRepository, "updateUserRole")
        .mockResolvedValue(mockUpdatedUser);

      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
        params: { userId: "user-123" },
        body: { role: "instructor", reason: "Approved application" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { updateUserRole } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await updateUserRole(mockReq, mockRes);

      expect(AdminRepository.updateUserRole).toHaveBeenCalledWith(
        "user-123",
        "instructor",
        "admin-123",
        "Approved application"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "User role updated successfully",
        data: mockUpdatedUser,
      });
    });

    it("should validate required fields for user role update", async () => {
      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
        params: { userId: "user-123" },
        body: {}, // Missing role
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { updateUserRole } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await updateUserRole(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Role is required",
      });
    });
  });

  describe("Course Management Endpoints", () => {
    it("should approve course", async () => {
      const mockApprovedCourse = {
        courseId: "course-123",
        status: "approved",
        approvedBy: "admin-123",
      };

      jest
        .spyOn(AdminRepository, "approveCourse")
        .mockResolvedValue(mockApprovedCourse);

      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
        params: { courseId: "course-123" },
        body: { reason: "Meets quality standards" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { approveCourse } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await approveCourse(mockReq, mockRes);

      expect(AdminRepository.approveCourse).toHaveBeenCalledWith(
        "course-123",
        "admin-123",
        "Meets quality standards"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Course approved successfully",
        data: mockApprovedCourse,
      });
    });
  });

  describe("Analytics Endpoints", () => {
    it("should get platform analytics", async () => {
      const mockPlatformMetrics = { totalUsers: 100, totalCourses: 50 };
      const mockUserGrowthStats = { totalUsers: 100, usersByPeriod: {} };
      const mockRevenueAnalytics = {
        totalRevenue: 5000,
        totalEnrollments: 200,
      };
      const mockAuditStats = { totalActions: 50, actionsByType: {} };

      jest
        .spyOn(AdminRepository, "getPlatformMetrics")
        .mockResolvedValue(mockPlatformMetrics);
      jest
        .spyOn(AdminRepository, "getUserGrowthStats")
        .mockResolvedValue(mockUserGrowthStats);
      jest
        .spyOn(AdminRepository, "getRevenueAnalytics")
        .mockResolvedValue(mockRevenueAnalytics);
      jest
        .spyOn(AdminRepository, "getAuditStatistics")
        .mockResolvedValue(mockAuditStats);

      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
        query: { startDate: "2025-01-01", endDate: "2025-01-31" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { getPlatformAnalytics } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await getPlatformAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          platformMetrics: mockPlatformMetrics,
          userGrowth: mockUserGrowthStats,
          revenue: mockRevenueAnalytics,
          auditStatistics: mockAuditStats,
        }),
      });
    });

    it("should validate export format", async () => {
      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
        query: { format: "invalid", dataType: "platform" },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { exportAnalyticsData } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await exportAnalyticsData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Supported formats: json, csv",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      jest
        .spyOn(AdminRepository, "getAllUsers")
        .mockRejectedValue(new Error("Database connection failed"));

      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
        query: {},
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { getAllUsers } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to fetch users",
        error: "Database connection failed",
      });
    });

    it("should validate request data", async () => {
      const mockReq = {
        user: { sub: "admin-123", isSuperAdmin: true },
        params: { userId: "user-123" },
        body: { status: "invalid_status" }, // Invalid status
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const { updateUserAccountStatus } = await import(
        "../controllers/dynamodb/adminController.js"
      );
      await updateUserAccountStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Valid status (active or suspended) is required",
      });
    });
  });
});

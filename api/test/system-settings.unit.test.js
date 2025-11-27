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

// Mock AdminRepository
const mockAdminRepository = {
  getSystemSettings: jest.fn(),
  updatePlatformSettings: jest.fn(),
  updateFeatureFlags: jest.fn(),
  updatePaymentSettings: jest.fn(),
  updateIntegrationSettings: jest.fn(),
  getSecurityPolicies: jest.fn(),
  updateSecurityPolicies: jest.fn(),
  logAdminAction: jest.fn(),
};

jest.unstable_mockModule("../models/dynamodb/admin-repository.js", () => ({
  AdminRepository: mockAdminRepository,
}));

// Import after mocking
const {
  getSystemSettings,
  updatePlatformSettings,
  updateFeatureFlags,
  updatePaymentSettings,
  updateIntegrationSettings,
  getSecurityPolicies,
  updateSecurityPolicies,
} = await import("../controllers/dynamodb/systemSettingsController.js");

describe("System Settings Controller Unit Tests", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { sub: "admin-123" },
      ip: "192.168.1.1",
      headers: { "user-agent": "test-agent" },
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Clear all mocks
    Object.values(mockAdminRepository).forEach((mock) => mock.mockClear());
  });

  describe("getSystemSettings", () => {
    it("should successfully get system settings", async () => {
      const mockSettings = {
        platformSettings: {
          platformName: "UpSkillPro",
          maintenanceMode: false,
        },
        featureFlags: {
          enableCourseReviews: true,
        },
      };

      mockAdminRepository.getSystemSettings.mockResolvedValueOnce(mockSettings);
      mockAdminRepository.logAdminAction.mockResolvedValueOnce({});

      await getSystemSettings(mockReq, mockRes);

      expect(mockAdminRepository.logAdminAction).toHaveBeenCalledWith(
        "admin-123",
        "SYSTEM_SETTINGS_ACCESSED",
        expect.objectContaining({
          targetEntity: "SYSTEM_SETTINGS",
        }),
        "192.168.1.1",
        "test-agent"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSettings,
      });
    });

    it("should handle errors when getting system settings", async () => {
      const error = new Error("Database error");
      mockAdminRepository.getSystemSettings.mockRejectedValueOnce(error);

      await getSystemSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to fetch system settings",
        error: "Database error",
      });
    });
  });

  describe("updatePlatformSettings", () => {
    it("should successfully update platform settings", async () => {
      const settings = {
        platformName: "New Platform Name",
        maintenanceMode: true,
        allowUserRegistration: false,
      };

      mockReq.body = { settings };

      const mockUpdatedSettings = {
        ...settings,
        updatedAt: "2025-01-15T10:00:00Z",
      };
      mockAdminRepository.updatePlatformSettings.mockResolvedValueOnce(
        mockUpdatedSettings
      );

      await updatePlatformSettings(mockReq, mockRes);

      expect(mockAdminRepository.updatePlatformSettings).toHaveBeenCalledWith(
        settings,
        "admin-123"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Platform settings updated successfully",
        data: mockUpdatedSettings,
      });
    });

    it("should validate platform settings", async () => {
      mockReq.body = {
        settings: {
          platformName: 123, // Invalid type
          maxFileUploadSize: -1, // Invalid value
        },
      };

      await updatePlatformSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid settings provided",
        errors: expect.arrayContaining([
          "Platform name must be a string",
          "Maximum file upload size must be a positive integer",
        ]),
      });
    });

    it("should require settings object", async () => {
      mockReq.body = {};

      await updatePlatformSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Settings object is required",
      });
    });
  });

  describe("updateFeatureFlags", () => {
    it("should successfully update feature flags", async () => {
      const featureFlags = {
        enableCourseReviews: true,
        enableCertificates: false,
        enableLiveStreaming: true,
      };

      mockReq.body = { featureFlags };

      const mockUpdatedFlags = {
        ...featureFlags,
        updatedAt: "2025-01-15T10:00:00Z",
      };
      mockAdminRepository.updateFeatureFlags.mockResolvedValueOnce(
        mockUpdatedFlags
      );

      await updateFeatureFlags(mockReq, mockRes);

      expect(mockAdminRepository.updateFeatureFlags).toHaveBeenCalledWith(
        featureFlags,
        "admin-123"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Feature flags updated successfully",
        data: mockUpdatedFlags,
      });
    });

    it("should require feature flags object", async () => {
      mockReq.body = {};

      await updateFeatureFlags(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Feature flags object is required",
      });
    });
  });

  describe("updatePaymentSettings", () => {
    it("should successfully update payment settings", async () => {
      const paymentSettings = {
        provider: "stripe",
        currency: "USD",
        commissionRate: 15,
      };

      mockReq.body = { paymentSettings };

      const mockUpdatedSettings = {
        ...paymentSettings,
        updatedAt: "2025-01-15T10:00:00Z",
      };
      mockAdminRepository.updatePaymentSettings.mockResolvedValueOnce(
        mockUpdatedSettings
      );

      await updatePaymentSettings(mockReq, mockRes);

      expect(mockAdminRepository.updatePaymentSettings).toHaveBeenCalledWith(
        paymentSettings,
        "admin-123"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Payment settings updated successfully",
        data: mockUpdatedSettings,
      });
    });

    it("should validate payment settings", async () => {
      mockReq.body = {
        paymentSettings: {
          provider: "invalid-provider",
          commissionRate: 150, // Invalid rate
        },
      };

      await updatePaymentSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid payment settings provided",
        errors: expect.arrayContaining([
          "Payment provider must be one of: stripe, paypal, square",
          "Commission rate must be a number between 0 and 100",
        ]),
      });
    });
  });

  describe("updateIntegrationSettings", () => {
    it("should successfully update integration settings", async () => {
      const integrationSettings = {
        emailProvider: "sendgrid",
        storageProvider: "aws-s3",
        analyticsProvider: "google-analytics",
      };

      mockReq.body = { integrationSettings };

      const mockUpdatedSettings = {
        ...integrationSettings,
        updatedAt: "2025-01-15T10:00:00Z",
      };
      mockAdminRepository.updateIntegrationSettings.mockResolvedValueOnce(
        mockUpdatedSettings
      );

      await updateIntegrationSettings(mockReq, mockRes);

      expect(
        mockAdminRepository.updateIntegrationSettings
      ).toHaveBeenCalledWith(integrationSettings, "admin-123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Integration settings updated successfully",
        data: mockUpdatedSettings,
      });
    });

    it("should require integration settings object", async () => {
      mockReq.body = {};

      await updateIntegrationSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Integration settings object is required",
      });
    });
  });

  describe("getSecurityPolicies", () => {
    it("should successfully get security policies", async () => {
      const mockPolicies = {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
        },
        sessionPolicy: {
          maxDuration: 24,
          idleTimeout: 2,
        },
      };

      mockAdminRepository.getSecurityPolicies.mockResolvedValueOnce(
        mockPolicies
      );
      mockAdminRepository.logAdminAction.mockResolvedValueOnce({});

      await getSecurityPolicies(mockReq, mockRes);

      expect(mockAdminRepository.logAdminAction).toHaveBeenCalledWith(
        "admin-123",
        "SECURITY_POLICIES_ACCESSED",
        expect.objectContaining({
          targetEntity: "SYSTEM#SECURITY_POLICIES",
        }),
        "192.168.1.1",
        "test-agent"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPolicies,
      });
    });
  });

  describe("updateSecurityPolicies", () => {
    it("should successfully update security policies", async () => {
      const policies = {
        passwordPolicy: {
          minLength: 10,
          requireUppercase: true,
          requireNumbers: true,
        },
        sessionPolicy: {
          maxDuration: 12,
          idleTimeout: 1,
        },
        accessControl: {
          maxRequestsPerMinute: 50,
          enableRateLimit: true,
        },
      };

      mockReq.body = { policies };

      const mockUpdatedPolicies = {
        ...policies,
        updatedAt: "2025-01-15T10:00:00Z",
      };
      mockAdminRepository.updateSecurityPolicies.mockResolvedValueOnce(
        mockUpdatedPolicies
      );

      await updateSecurityPolicies(mockReq, mockRes);

      expect(mockAdminRepository.updateSecurityPolicies).toHaveBeenCalledWith(
        policies,
        "admin-123"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Security policies updated successfully",
        data: mockUpdatedPolicies,
      });
    });

    it("should validate security policies", async () => {
      mockReq.body = {
        policies: {
          passwordPolicy: {
            minLength: 3, // Too short
            maxAge: 400, // Too long
          },
          sessionPolicy: {
            maxDuration: 200, // Too long
            maxConcurrentSessions: 15, // Too many
          },
          accessControl: {
            maxRequestsPerMinute: 5, // Too low
            allowedIPs: ["invalid-ip"], // Invalid IP format
          },
        },
      };

      await updateSecurityPolicies(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid security policies provided",
        errors: expect.arrayContaining([
          "Password minimum length must be between 6 and 50 characters",
          "Password maximum age must be between 1 and 365 days",
          "Session maximum duration must be between 1 and 168 hours",
          "Maximum concurrent sessions must be between 1 and 10",
          "Maximum requests per minute must be between 10 and 1000",
          "Invalid IP address format at index 0: invalid-ip",
        ]),
      });
    });

    it("should require policies object", async () => {
      mockReq.body = {};

      await updateSecurityPolicies(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Policies object is required",
      });
    });
  });
});

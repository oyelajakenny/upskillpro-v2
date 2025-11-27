import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import bodyParser from "body-parser";

// Mock DynamoDB client
const mockSend = jest.fn();
jest.unstable_mockModule("../config/dynamodb.js", () => ({
  default: {
    send: mockSend,
  },
  TABLE_NAME: "LearningPlatform",
}));

// Mock authentication middleware
const mockAuthenticateToken = jest.fn((req, res, next) => {
  req.user = { sub: "admin-123", role: "super_admin" };
  next();
});

const mockAuthorizeSuperAdmin = jest.fn((req, res, next) => {
  next();
});

const mockAuditLogger = jest.fn(() => (req, res, next) => {
  next();
});

jest.unstable_mockModule("../middlewares/authenticateToken.js", () => ({
  default: mockAuthenticateToken,
}));

jest.unstable_mockModule("../middlewares/authorizeRole.js", () => ({
  authorizeSuperAdmin: mockAuthorizeSuperAdmin,
}));

jest.unstable_mockModule("../middlewares/auditLogger.js", () => ({
  default: mockAuditLogger,
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

const { GetCommand, UpdateCommand, PutCommand } = await import(
  "@aws-sdk/lib-dynamodb"
);

describe("System Settings Integration Tests", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(bodyParser.json());

    // System settings routes
    app.get(
      "/api/admin/settings",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getSystemSettings
    );
    app.put(
      "/api/admin/settings/platform",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      updatePlatformSettings
    );
    app.put(
      "/api/admin/settings/features",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      updateFeatureFlags
    );
    app.put(
      "/api/admin/settings/payment",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      updatePaymentSettings
    );
    app.put(
      "/api/admin/settings/integrations",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      updateIntegrationSettings
    );

    // Security policies routes
    app.get(
      "/api/admin/security/policies",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getSecurityPolicies
    );
    app.put(
      "/api/admin/security/policies",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      updateSecurityPolicies
    );
  });

  beforeEach(() => {
    mockSend.mockClear();
  });

  describe("GET /api/admin/settings", () => {
    it("should return system settings successfully", async () => {
      const mockSettings = {
        platformSettings: {
          platformName: "UpSkillPro",
          maintenanceMode: false,
          allowUserRegistration: true,
        },
        featureFlags: {
          enableCourseReviews: true,
          enableCertificates: true,
        },
        paymentSettings: {
          provider: "stripe",
          currency: "USD",
        },
        integrationSettings: {
          emailProvider: "sendgrid",
          storageProvider: "aws-s3",
        },
      };

      // Mock getting system settings
      mockSend.mockResolvedValueOnce({
        Item: mockSettings,
      });

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .get("/api/admin/settings")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSettings);
      expect(mockSend).toHaveBeenCalledWith(expect.any(GetCommand));
    });

    it("should return default settings when none exist", async () => {
      // Mock no existing settings
      mockSend.mockResolvedValueOnce({});

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .get("/api/admin/settings")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.platformSettings.platformName).toBe(
        "UpSkillPro"
      );
      expect(response.body.data.featureFlags.enableCourseReviews).toBe(true);
    });
  });

  describe("PUT /api/admin/settings/platform", () => {
    it("should update platform settings successfully", async () => {
      const settingsUpdate = {
        platformName: "New Platform Name",
        maintenanceMode: true,
        allowUserRegistration: false,
        maxFileUploadSize: 200,
      };

      // Mock getting current settings for audit
      mockSend.mockResolvedValueOnce({
        Item: {
          platformSettings: {
            platformName: "Old Name",
            maintenanceMode: false,
          },
        },
      });

      // Mock update operation
      mockSend.mockResolvedValueOnce({
        Attributes: {
          platformSettings: settingsUpdate,
          updatedAt: "2025-01-15T10:00:00Z",
        },
      });

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .put("/api/admin/settings/platform")
        .send({ settings: settingsUpdate })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Platform settings updated successfully"
      );
      expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
    });

    it("should validate platform settings", async () => {
      const invalidSettings = {
        platformName: 123, // Invalid type
        maxFileUploadSize: -1, // Invalid value
      };

      const response = await request(app)
        .put("/api/admin/settings/platform")
        .send({ settings: invalidSettings })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain("Platform name must be a string");
      expect(response.body.errors).toContain(
        "Maximum file upload size must be a positive integer"
      );
    });

    it("should require settings object", async () => {
      const response = await request(app)
        .put("/api/admin/settings/platform")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Settings object is required");
    });
  });

  describe("PUT /api/admin/settings/features", () => {
    it("should update feature flags successfully", async () => {
      const featureFlags = {
        enableCourseReviews: false,
        enableCertificates: true,
        enableLiveStreaming: true,
      };

      // Mock getting current settings for audit
      mockSend.mockResolvedValueOnce({
        Item: {
          featureFlags: {
            enableCourseReviews: true,
            enableCertificates: false,
          },
        },
      });

      // Mock update operation
      mockSend.mockResolvedValueOnce({
        Attributes: {
          featureFlags,
          updatedAt: "2025-01-15T10:00:00Z",
        },
      });

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .put("/api/admin/settings/features")
        .send({ featureFlags })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Feature flags updated successfully");
    });
  });

  describe("PUT /api/admin/settings/payment", () => {
    it("should update payment settings successfully", async () => {
      const paymentSettings = {
        provider: "stripe",
        currency: "EUR",
        commissionRate: 20,
        enableRefunds: true,
      };

      // Mock getting current settings for audit
      mockSend.mockResolvedValueOnce({
        Item: {
          paymentSettings: {
            provider: "paypal",
            currency: "USD",
          },
        },
      });

      // Mock update operation
      mockSend.mockResolvedValueOnce({
        Attributes: {
          paymentSettings,
          updatedAt: "2025-01-15T10:00:00Z",
        },
      });

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .put("/api/admin/settings/payment")
        .send({ paymentSettings })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Payment settings updated successfully"
      );
    });

    it("should validate payment settings", async () => {
      const invalidSettings = {
        provider: "invalid-provider",
        commissionRate: 150,
      };

      const response = await request(app)
        .put("/api/admin/settings/payment")
        .send({ paymentSettings: invalidSettings })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        "Payment provider must be one of: stripe, paypal, square"
      );
      expect(response.body.errors).toContain(
        "Commission rate must be a number between 0 and 100"
      );
    });
  });

  describe("PUT /api/admin/settings/integrations", () => {
    it("should update integration settings successfully", async () => {
      const integrationSettings = {
        emailProvider: "mailgun",
        storageProvider: "google-cloud",
        analyticsProvider: "mixpanel",
        enableWebhooks: true,
      };

      // Mock getting current settings for audit
      mockSend.mockResolvedValueOnce({
        Item: {
          integrationSettings: {
            emailProvider: "sendgrid",
            storageProvider: "aws-s3",
          },
        },
      });

      // Mock update operation
      mockSend.mockResolvedValueOnce({
        Attributes: {
          integrationSettings,
          updatedAt: "2025-01-15T10:00:00Z",
        },
      });

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .put("/api/admin/settings/integrations")
        .send({ integrationSettings })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Integration settings updated successfully"
      );
    });
  });

  describe("GET /api/admin/security/policies", () => {
    it("should return security policies successfully", async () => {
      const mockPolicies = {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
        },
        sessionPolicy: {
          maxDuration: 24,
          idleTimeout: 2,
        },
        accessControl: {
          enableRateLimit: true,
          maxRequestsPerMinute: 100,
        },
      };

      // Mock getting security policies
      mockSend.mockResolvedValueOnce({
        Item: mockPolicies,
      });

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .get("/api/admin/security/policies")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPolicies);
    });

    it("should return default policies when none exist", async () => {
      // Mock no existing policies
      mockSend.mockResolvedValueOnce({});

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .get("/api/admin/security/policies")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.passwordPolicy.minLength).toBe(8);
      expect(response.body.data.sessionPolicy.maxDuration).toBe(24);
    });
  });

  describe("PUT /api/admin/security/policies", () => {
    it("should update security policies successfully", async () => {
      const policies = {
        passwordPolicy: {
          minLength: 10,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
        sessionPolicy: {
          maxDuration: 12,
          idleTimeout: 1,
          requireMFA: true,
        },
        accessControl: {
          enableRateLimit: true,
          maxRequestsPerMinute: 50,
          enableBruteForceProtection: true,
        },
      };

      // Mock getting current policies for audit
      mockSend.mockResolvedValueOnce({
        Item: {
          passwordPolicy: { minLength: 8 },
          sessionPolicy: { maxDuration: 24 },
        },
      });

      // Mock update operation
      mockSend.mockResolvedValueOnce({
        Attributes: {
          ...policies,
          updatedAt: "2025-01-15T10:00:00Z",
        },
      });

      // Mock audit logging
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .put("/api/admin/security/policies")
        .send({ policies })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Security policies updated successfully"
      );
    });

    it("should validate security policies", async () => {
      const invalidPolicies = {
        passwordPolicy: {
          minLength: 3, // Too short
          maxAge: 400, // Too long
        },
        sessionPolicy: {
          maxDuration: 200, // Too long
        },
        accessControl: {
          maxRequestsPerMinute: 5, // Too low
          allowedIPs: ["invalid-ip"],
        },
      };

      const response = await request(app)
        .put("/api/admin/security/policies")
        .send({ policies: invalidPolicies })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        "Password minimum length must be between 6 and 50 characters"
      );
      expect(response.body.errors).toContain(
        "Password maximum age must be between 1 and 365 days"
      );
      expect(response.body.errors).toContain(
        "Session maximum duration must be between 1 and 168 hours"
      );
      expect(response.body.errors).toContain(
        "Maximum requests per minute must be between 10 and 1000"
      );
      expect(response.body.errors).toContain(
        "Invalid IP address format at index 0: invalid-ip"
      );
    });

    it("should require policies object", async () => {
      const response = await request(app)
        .put("/api/admin/security/policies")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Policies object is required");
    });
  });
});

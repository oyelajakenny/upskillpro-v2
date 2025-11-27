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

describe("System Maintenance Integration Tests", () => {
  let app;
  let getSystemHealth,
    getDatabaseHealth,
    getApiMetrics,
    getRealTimeSystemMetrics,
    performDataCleanup,
    getStorageMetrics,
    createDataBackup,
    getAllBackups,
    restoreFromBackup,
    scheduleMaintenanceWindow,
    getAllMaintenanceWindows,
    updateMaintenanceWindow;

  beforeAll(async () => {
    // Import after mocking
    const adminController = await import(
      "../controllers/dynamodb/adminController.js"
    );
    getSystemHealth = adminController.getSystemHealth;
    getDatabaseHealth = adminController.getDatabaseHealth;
    getApiMetrics = adminController.getApiMetrics;
    getRealTimeSystemMetrics = adminController.getRealTimeSystemMetrics;
    performDataCleanup = adminController.performDataCleanup;
    getStorageMetrics = adminController.getStorageMetrics;
    createDataBackup = adminController.createDataBackup;
    getAllBackups = adminController.getAllBackups;
    restoreFromBackup = adminController.restoreFromBackup;
    scheduleMaintenanceWindow = adminController.scheduleMaintenanceWindow;
    getAllMaintenanceWindows = adminController.getAllMaintenanceWindows;
    updateMaintenanceWindow = adminController.updateMaintenanceWindow;

    app = express();
    app.use(bodyParser.json());

    // System health routes
    app.get(
      "/api/admin/system/health",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getSystemHealth
    );
    app.get(
      "/api/admin/system/database",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getDatabaseHealth
    );
    app.get(
      "/api/admin/system/api-metrics",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getApiMetrics
    );
    app.get(
      "/api/admin/system/metrics/realtime",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getRealTimeSystemMetrics
    );

    // Data cleanup and storage routes
    app.post(
      "/api/admin/system/cleanup",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      performDataCleanup
    );
    app.get(
      "/api/admin/system/storage",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getStorageMetrics
    );

    // Backup routes
    app.post(
      "/api/admin/system/backups",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      createDataBackup
    );
    app.get(
      "/api/admin/system/backups",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getAllBackups
    );
    app.post(
      "/api/admin/system/backups/:backupId/restore",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      restoreFromBackup
    );

    // Maintenance routes
    app.post(
      "/api/admin/system/maintenance",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      scheduleMaintenanceWindow
    );
    app.get(
      "/api/admin/system/maintenance",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      getAllMaintenanceWindows
    );
    app.put(
      "/api/admin/system/maintenance/:maintenanceId",
      mockAuthenticateToken,
      mockAuthorizeSuperAdmin,
      updateMaintenanceWindow
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("System Health Monitoring", () => {
    it("should get system health metrics", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
      });

      const response = await request(app)
        .get("/api/admin/system/health?timeRange=1h")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBeDefined();
    });

    it("should get database health metrics", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
      });

      const response = await request(app)
        .get("/api/admin/system/database?timeRange=1h")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBeDefined();
    });

    it("should get API metrics", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
      });

      const response = await request(app)
        .get("/api/admin/system/api-metrics?timeRange=1h")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should get real-time system metrics", async () => {
      const response = await request(app)
        .get("/api/admin/system/metrics/realtime")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe("Data Cleanup", () => {
    it("should perform data cleanup in dry run mode", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ PK: "AUDIT#admin-123", SK: "ACTION#2024-01-01T00:00:00Z#1" }],
      });

      const response = await request(app)
        .post("/api/admin/system/cleanup")
        .send({
          cleanupType: "old_audit_logs",
          daysOld: 90,
          dryRun: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Dry run");
      expect(response.body.data.itemsAffected).toBeDefined();
    });

    it("should perform actual data cleanup", async () => {
      mockSend
        .mockResolvedValueOnce({
          Items: [
            { PK: "AUDIT#admin-123", SK: "ACTION#2024-01-01T00:00:00Z#1" },
          ],
        })
        .mockResolvedValueOnce({});

      const response = await request(app)
        .post("/api/admin/system/cleanup")
        .send({
          cleanupType: "old_audit_logs",
          daysOld: 90,
          dryRun: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("completed successfully");
    });

    it("should require cleanup type", async () => {
      const response = await request(app)
        .post("/api/admin/system/cleanup")
        .send({
          daysOld: 90,
          dryRun: true,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("required");
    });
  });

  describe("Storage Metrics", () => {
    it("should get storage metrics", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
      });

      const response = await request(app)
        .get("/api/admin/system/storage")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalStorageUsed).toBeDefined();
    });
  });

  describe("Backup Management", () => {
    it("should create a full backup", async () => {
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .post("/api/admin/system/backups")
        .send({
          backupType: "full",
          includeData: [],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("created successfully");
      expect(response.body.data.backupId).toBeDefined();
    });

    it("should create a selective backup", async () => {
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .post("/api/admin/system/backups")
        .send({
          backupType: "selective",
          includeData: ["users", "courses"],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.backupType).toBe("selective");
    });

    it("should require backup type", async () => {
      const response = await request(app)
        .post("/api/admin/system/backups")
        .send({
          includeData: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("required");
    });

    it("should get all backups", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            PK: "BACKUP#backup-1",
            SK: "METADATA",
            backupId: "backup-1",
            backupType: "full",
            status: "completed",
            createdAt: "2024-01-15T10:00:00Z",
          },
        ],
      });

      const response = await request(app)
        .get("/api/admin/system/backups")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.backups).toBeDefined();
      expect(Array.isArray(response.body.data.backups)).toBe(true);
    });

    it("should restore from backup", async () => {
      mockSend
        .mockResolvedValueOnce({
          Item: {
            backupId: "backup-1",
            status: "completed",
          },
        })
        .mockResolvedValueOnce({});

      const response = await request(app)
        .post("/api/admin/system/backups/backup-1/restore")
        .send({
          restoreOptions: {},
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("restored successfully");
    });
  });

  describe("Maintenance Windows", () => {
    it("should schedule a maintenance window", async () => {
      mockSend.mockResolvedValueOnce({});

      const response = await request(app)
        .post("/api/admin/system/maintenance")
        .send({
          title: "Database Upgrade",
          description: "Upgrading database to latest version",
          startTime: "2024-12-01T02:00:00Z",
          endTime: "2024-12-01T04:00:00Z",
          maintenanceType: "scheduled",
          affectedServices: ["database", "api"],
          notifyUsers: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("scheduled successfully");
      expect(response.body.data.maintenanceId).toBeDefined();
    });

    it("should require all mandatory fields for maintenance", async () => {
      const response = await request(app)
        .post("/api/admin/system/maintenance")
        .send({
          title: "Database Upgrade",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("required");
    });

    it("should get all maintenance windows", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            PK: "MAINTENANCE#maint-1",
            SK: "METADATA",
            maintenanceId: "maint-1",
            title: "Database Upgrade",
            status: "scheduled",
            startTime: "2024-12-01T02:00:00Z",
            endTime: "2024-12-01T04:00:00Z",
          },
        ],
      });

      const response = await request(app)
        .get("/api/admin/system/maintenance")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maintenanceWindows).toBeDefined();
      expect(Array.isArray(response.body.data.maintenanceWindows)).toBe(true);
    });

    it("should update maintenance window status", async () => {
      mockSend
        .mockResolvedValueOnce({
          Item: {
            maintenanceId: "maint-1",
            status: "scheduled",
          },
        })
        .mockResolvedValueOnce({});

      const response = await request(app)
        .put("/api/admin/system/maintenance/maint-1")
        .send({
          status: "in_progress",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("updated successfully");
    });
  });
});

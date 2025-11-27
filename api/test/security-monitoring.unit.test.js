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
  v4: jest.fn(() => "mock-security-event-123"),
}));

// Import after mocking
const { AdminRepository } = await import(
  "../models/dynamodb/admin-repository.js"
);
const { ScanCommand, PutCommand } = await import("@aws-sdk/lib-dynamodb");

describe("Security Monitoring Unit Tests", () => {
  beforeEach(() => {
    mockSend.mockClear();
    jest.clearAllMocks();
  });

  describe("getSecurityEvents", () => {
    it("should get security events with default parameters", async () => {
      const mockSecurityEvents = [
        {
          eventId: "event-1",
          eventType: "LOGIN_ATTEMPT",
          userId: "user-123",
          ipAddress: "192.168.1.1",
          timestamp: "2025-01-15T10:00:00Z",
        },
        {
          eventId: "event-2",
          eventType: "FAILED_LOGIN",
          userId: "user-456",
          ipAddress: "192.168.1.2",
          timestamp: "2025-01-15T10:05:00Z",
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockSecurityEvents,
        Count: 2,
      });

      const result = await AdminRepository.getSecurityEvents();

      expect(mockSend).toHaveBeenCalledWith(expect.any(ScanCommand));
      expect(result.securityEvents).toEqual(mockSecurityEvents);
      expect(result.loginAttempts).toHaveLength(1);
      expect(result.failedLogins).toHaveLength(1);
      expect(result.count).toBe(2);
    });

    it("should filter security events by date range", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
      });

      const startDate = "2025-01-15T00:00:00Z";
      const endDate = "2025-01-15T23:59:59Z";

      await AdminRepository.getSecurityEvents({ startDate, endDate });

      const callArgs = mockSend.mock.calls[0][0].input;
      expect(callArgs.FilterExpression).toContain(
        "#timestamp BETWEEN :startDate AND :endDate"
      );
      expect(callArgs.ExpressionAttributeValues[":startDate"]).toBe(startDate);
      expect(callArgs.ExpressionAttributeValues[":endDate"]).toBe(endDate);
    });

    it("should categorize events correctly", async () => {
      const mockEvents = [
        { eventType: "LOGIN_ATTEMPT" },
        { eventType: "LOGIN_ATTEMPT" },
        { eventType: "FAILED_LOGIN" },
        { eventType: "SUSPICIOUS_ACTIVITY" },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockEvents,
        Count: 4,
      });

      const result = await AdminRepository.getSecurityEvents();

      expect(result.loginAttempts).toHaveLength(2);
      expect(result.failedLogins).toHaveLength(1);
      expect(result.suspiciousActivity).toHaveLength(1);
    });
  });

  describe("logSecurityEvent", () => {
    it("should log security event with all details", async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await AdminRepository.logSecurityEvent(
        "FAILED_LOGIN",
        "user-123",
        { reason: "Invalid password" },
        "192.168.1.1",
        "Mozilla/5.0"
      );

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));

      const putArgs = mockSend.mock.calls[0][0].input.Item;
      expect(putArgs.eventType).toBe("FAILED_LOGIN");
      expect(putArgs.userId).toBe("user-123");
      expect(putArgs.details.reason).toBe("Invalid password");
      expect(putArgs.ipAddress).toBe("192.168.1.1");
      expect(putArgs.userAgent).toBe("Mozilla/5.0");
      expect(putArgs.eventId).toBe("mock-security-event-123");
    });

    it("should handle null userId", async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await AdminRepository.logSecurityEvent(
        "SUSPICIOUS_ACTIVITY",
        null,
        { reason: "Multiple failed attempts" },
        "192.168.1.1",
        "Mozilla/5.0"
      );

      const putArgs = mockSend.mock.calls[0][0].input.Item;
      expect(putArgs.userId).toBeNull();
      expect(putArgs.eventType).toBe("SUSPICIOUS_ACTIVITY");
    });
  });

  describe("getUserActivityLogs", () => {
    it("should get user activity logs combining security events and audit logs", async () => {
      const mockSecurityEvents = [
        {
          eventId: "event-1",
          eventType: "LOGIN_ATTEMPT",
          userId: "user-123",
          timestamp: "2025-01-15T10:00:00Z",
        },
      ];

      const mockAuditLogs = [
        {
          actionId: "action-1",
          action: "USER_ROLE_CHANGE",
          details: { targetEntity: "USER#user-123" },
          timestamp: "2025-01-15T09:00:00Z",
        },
      ];

      mockSend
        .mockResolvedValueOnce({ Items: mockSecurityEvents }) // Security events
        .mockResolvedValueOnce({ Items: mockAuditLogs, Count: 1 }); // Audit logs

      const result = await AdminRepository.getUserActivityLogs("user-123");

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(result.securityEvents).toEqual(mockSecurityEvents);
      expect(result.auditLogs).toHaveLength(1);
      expect(result.totalEvents).toBe(2);
    });

    it("should filter by date range", async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [], Count: 0 });

      const startDate = "2025-01-15T00:00:00Z";
      const endDate = "2025-01-15T23:59:59Z";

      await AdminRepository.getUserActivityLogs("user-123", {
        startDate,
        endDate,
      });

      const securityCallArgs = mockSend.mock.calls[0][0].input;
      expect(securityCallArgs.FilterExpression).toContain(
        "#timestamp BETWEEN :startDate AND :endDate"
      );
    });
  });

  describe("detectSuspiciousActivity", () => {
    it("should detect excessive failed logins by IP", async () => {
      const mockFailedLogins = Array(12)
        .fill(null)
        .map((_, i) => ({
          eventType: "FAILED_LOGIN",
          ipAddress: "192.168.1.1",
          timestamp: `2025-01-15T10:${i.toString().padStart(2, "0")}:00Z`,
        }));

      mockSend.mockResolvedValueOnce({
        Items: mockFailedLogins,
      });

      const result = await AdminRepository.detectSuspiciousActivity();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe("EXCESSIVE_FAILED_LOGINS_IP");
      expect(result.alerts[0].severity).toBe("HIGH");
      expect(result.alerts[0].details.ipAddress).toBe("192.168.1.1");
      expect(result.alerts[0].details.failedAttempts).toBe(12);
    });

    it("should detect excessive failed logins by user", async () => {
      const mockFailedLogins = Array(6)
        .fill(null)
        .map((_, i) => ({
          eventType: "FAILED_LOGIN",
          userId: "user-123",
          ipAddress: `192.168.1.${i + 1}`,
          timestamp: `2025-01-15T10:${i.toString().padStart(2, "0")}:00Z`,
        }));

      mockSend.mockResolvedValueOnce({
        Items: mockFailedLogins,
      });

      const result = await AdminRepository.detectSuspiciousActivity();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe("EXCESSIVE_FAILED_LOGINS_USER");
      expect(result.alerts[0].severity).toBe("MEDIUM");
      expect(result.alerts[0].details.userId).toBe("user-123");
      expect(result.alerts[0].details.failedAttempts).toBe(6);
    });

    it("should detect multiple IP logins", async () => {
      const mockLoginAttempts = [
        {
          eventType: "LOGIN_ATTEMPT",
          userId: "user-123",
          ipAddress: "192.168.1.1",
          details: { success: true },
        },
        {
          eventType: "LOGIN_ATTEMPT",
          userId: "user-123",
          ipAddress: "192.168.1.2",
          details: { success: true },
        },
        {
          eventType: "LOGIN_ATTEMPT",
          userId: "user-123",
          ipAddress: "192.168.1.3",
          details: { success: true },
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockLoginAttempts,
      });

      const result = await AdminRepository.detectSuspiciousActivity();

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].type).toBe("MULTIPLE_IP_LOGINS");
      expect(result.alerts[0].severity).toBe("MEDIUM");
      expect(result.alerts[0].details.userId).toBe("user-123");
      expect(result.alerts[0].details.ipAddresses).toHaveLength(3);
    });

    it("should return summary statistics", async () => {
      const mockEvents = [
        { eventType: "FAILED_LOGIN", ipAddress: "192.168.1.1" },
        { eventType: "FAILED_LOGIN", ipAddress: "192.168.1.1" },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockEvents,
      });

      const result = await AdminRepository.detectSuspiciousActivity();

      expect(result.summary).toBeDefined();
      expect(result.summary.totalAlerts).toBe(0); // Not enough to trigger alerts
      expect(result.summary.highSeverity).toBe(0);
      expect(result.summary.mediumSeverity).toBe(0);
      expect(result.summary.lowSeverity).toBe(0);
    });
  });

  describe("getSecurityDashboard", () => {
    it("should return comprehensive security dashboard data", async () => {
      const mockSecurityEvents = [
        {
          eventType: "LOGIN_ATTEMPT",
          details: { success: true },
          timestamp: "2025-01-15T10:00:00Z",
        },
        {
          eventType: "LOGIN_ATTEMPT",
          details: { success: true },
          timestamp: "2025-01-15T10:30:00Z",
        },
        {
          eventType: "FAILED_LOGIN",
          timestamp: "2025-01-15T11:00:00Z",
        },
        {
          eventType: "SUSPICIOUS_ACTIVITY",
          timestamp: "2025-01-15T11:30:00Z",
        },
      ];

      // Mock getSecurityEvents call
      mockSend.mockResolvedValueOnce({
        Items: mockSecurityEvents,
      });

      // Mock detectSuspiciousActivity call
      mockSend.mockResolvedValueOnce({
        Items: mockSecurityEvents,
      });

      const result = await AdminRepository.getSecurityDashboard();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalLoginAttempts).toBe(2);
      expect(result.metrics.successfulLogins).toBe(2);
      expect(result.metrics.failedLoginAttempts).toBe(1);
      expect(result.metrics.loginSuccessRate).toBe("100.0");
      expect(result.metrics.suspiciousActivityCount).toBe(1);

      expect(result.trends).toBeDefined();
      expect(result.trends.eventsByHour).toBeDefined();
      expect(result.recentEvents).toHaveLength(4);
    });

    it("should handle zero login attempts", async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] });

      const result = await AdminRepository.getSecurityDashboard();

      expect(result.metrics.totalLoginAttempts).toBe(0);
      expect(result.metrics.loginSuccessRate).toBe(0);
    });

    it("should group events by hour correctly", async () => {
      const mockEvents = [
        {
          eventType: "LOGIN_ATTEMPT",
          timestamp: "2025-01-15T10:15:00Z",
        },
        {
          eventType: "FAILED_LOGIN",
          timestamp: "2025-01-15T10:45:00Z",
        },
        {
          eventType: "LOGIN_ATTEMPT",
          timestamp: "2025-01-15T11:15:00Z",
        },
      ];

      mockSend
        .mockResolvedValueOnce({ Items: mockEvents })
        .mockResolvedValueOnce({ Items: mockEvents });

      const result = await AdminRepository.getSecurityDashboard();

      const trends = result.trends.eventsByHour;
      expect(trends["2025-01-15T10"]).toBeDefined();
      expect(trends["2025-01-15T10"].total).toBe(2);
      expect(trends["2025-01-15T10"].failed).toBe(1);
      expect(trends["2025-01-15T11"]).toBeDefined();
      expect(trends["2025-01-15T11"].total).toBe(1);
    });
  });
});

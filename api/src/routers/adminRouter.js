import express from "express";
import authenticateToken from "../../middlewares/authenticateToken.js";
import { authorizeSuperAdmin } from "../../middlewares/authorizeRole.js";
import auditLogger from "../../middlewares/auditLogger.js";
import {
  // Admin verification endpoint
  verifyAdminAccess,

  // Dashboard endpoints
  getDashboardOverview,
  getRealTimeMetrics,
  getRecentActivityFeed,

  // User management endpoints
  getAllUsers,
  getUserProfile,
  updateUserRole,
  updateUserAccountStatus,
  getUserActivity,

  // Course management endpoints
  getAllCourses,
  getCourseDetails,
  approveCourse,
  rejectCourse,
  moderateCourseContent,
  getInstructorPerformance,
  getCourseAnalytics,

  // Analytics and reporting endpoints
  getPlatformAnalytics,
  getRevenueAnalytics,
  getUserGrowthStats,
  exportAnalyticsData,
  getAuditReports,
  sendReportEmail,
  createScheduledReport,
  updateScheduledReport,

  // Security monitoring endpoints
  getSecurityDashboard,
  getSecurityEvents,
  getSuspiciousActivity,
  getUserActivityLogs,
  logSecurityEvent,

  // Support ticket endpoints
  getAllSupportTickets,
  getSupportTicketById,
  createSupportTicket,
  updateSupportTicket,
  addTicketMessage,
  resolveSupportTicket,
  getTicketStatistics,

  // Communication and notification endpoints
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  createNotificationTemplate,
  getAllNotificationTemplates,
  sendTargetedNotification,
  getNotificationStats,

  // System health and monitoring endpoints
  getSystemHealth,
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
  updateMaintenanceWindow,
} from "../../controllers/dynamodb/adminController.js";

import {
  // System settings endpoints
  getSystemSettings,
  updatePlatformSettings,
  updateFeatureFlags,
  updatePaymentSettings,
  updateIntegrationSettings,
  getSecurityPolicies,
  updateSecurityPolicies,
} from "../../controllers/dynamodb/systemSettingsController.js";

const router = express.Router();

// Admin verification endpoint (only requires authentication, not super admin role)
router.get("/verify", authenticateToken, verifyAdminAccess);

// Apply authentication and authorization middleware to all other admin routes
router.use(authenticateToken);
router.use(authorizeSuperAdmin);

// Dashboard routes
router.get(
  "/dashboard/overview",
  auditLogger("DASHBOARD_VIEW"),
  getDashboardOverview
);
router.get(
  "/dashboard/metrics",
  auditLogger("METRICS_VIEW"),
  getRealTimeMetrics
);
router.get(
  "/dashboard/activity",
  auditLogger("ACTIVITY_VIEW"),
  getRecentActivityFeed
);

// User management routes
router.get("/users", auditLogger("USERS_LIST"), getAllUsers);
router.get("/users/:userId", auditLogger("USER_VIEW"), getUserProfile);
router.put(
  "/users/:userId/role",
  auditLogger("USER_ROLE_UPDATE"),
  updateUserRole
);
router.put(
  "/users/:userId/status",
  auditLogger("USER_STATUS_UPDATE"),
  updateUserAccountStatus
);
router.get(
  "/users/:userId/activity",
  auditLogger("USER_ACTIVITY_VIEW"),
  getUserActivity
);

// Course management routes
router.get("/courses", auditLogger("COURSES_LIST"), getAllCourses);
router.get("/courses/:courseId", auditLogger("COURSE_VIEW"), getCourseDetails);
router.put(
  "/courses/:courseId/approve",
  auditLogger("COURSE_APPROVAL"),
  approveCourse
);
router.put(
  "/courses/:courseId/reject",
  auditLogger("COURSE_REJECTION"),
  rejectCourse
);
router.put(
  "/courses/:courseId/moderate",
  auditLogger("CONTENT_MODERATION"),
  moderateCourseContent
);
router.get(
  "/instructors/:instructorId/performance",
  auditLogger("INSTRUCTOR_PERFORMANCE_VIEW"),
  getInstructorPerformance
);
router.get(
  "/courses/analytics",
  auditLogger("COURSE_ANALYTICS_VIEW"),
  getCourseAnalytics
);

// Analytics and reporting routes
router.get("/analytics", auditLogger("ANALYTICS_VIEW"), getPlatformAnalytics);
router.get(
  "/analytics/platform",
  auditLogger("PLATFORM_ANALYTICS_VIEW"),
  getPlatformAnalytics
);
router.get(
  "/analytics/revenue",
  auditLogger("REVENUE_ANALYTICS_VIEW"),
  getRevenueAnalytics
);
router.get(
  "/analytics/users",
  auditLogger("USER_ANALYTICS_VIEW"),
  getUserGrowthStats
);
router.get(
  "/analytics/export",
  auditLogger("DATA_EXPORT"),
  exportAnalyticsData
);
router.get(
  "/audit/reports",
  auditLogger("AUDIT_REPORTS_VIEW"),
  getAuditReports
);

// Advanced reporting routes
router.post(
  "/reports/email",
  auditLogger("REPORT_EMAIL_SEND"),
  sendReportEmail
);
router.post(
  "/reports/schedule",
  auditLogger("SCHEDULED_REPORT_CREATE"),
  createScheduledReport
);
router.patch(
  "/reports/schedule/:reportId",
  auditLogger("SCHEDULED_REPORT_UPDATE"),
  updateScheduledReport
);

// System settings routes
router.get("/settings", auditLogger("SYSTEM_SETTINGS_VIEW"), getSystemSettings);
router.put(
  "/settings/platform",
  auditLogger("PLATFORM_SETTINGS_UPDATE"),
  updatePlatformSettings
);
router.put(
  "/settings/features",
  auditLogger("FEATURE_FLAGS_UPDATE"),
  updateFeatureFlags
);
router.put(
  "/settings/payment",
  auditLogger("PAYMENT_SETTINGS_UPDATE"),
  updatePaymentSettings
);
router.put(
  "/settings/integrations",
  auditLogger("INTEGRATION_SETTINGS_UPDATE"),
  updateIntegrationSettings
);

// Security policies routes
router.get(
  "/security/policies",
  auditLogger("SECURITY_POLICIES_VIEW"),
  getSecurityPolicies
);
router.put(
  "/security/policies",
  auditLogger("SECURITY_POLICIES_UPDATE"),
  updateSecurityPolicies
);

// Security monitoring routes
router.get(
  "/security/dashboard",
  auditLogger("SECURITY_DASHBOARD_VIEW"),
  getSecurityDashboard
);
router.get(
  "/security/events",
  auditLogger("SECURITY_EVENTS_VIEW"),
  getSecurityEvents
);
router.get(
  "/security/suspicious",
  auditLogger("SUSPICIOUS_ACTIVITY_VIEW"),
  getSuspiciousActivity
);
router.get(
  "/users/:userId/activity-logs",
  auditLogger("USER_ACTIVITY_LOGS_VIEW"),
  getUserActivityLogs
);
router.post(
  "/security/events",
  auditLogger("SECURITY_EVENT_LOG"),
  logSecurityEvent
);

// Support ticket routes
router.get(
  "/support/tickets",
  auditLogger("SUPPORT_TICKETS_LIST"),
  getAllSupportTickets
);
router.get(
  "/support/tickets/statistics",
  auditLogger("TICKET_STATISTICS_VIEW"),
  getTicketStatistics
);
router.get(
  "/support/tickets/:ticketId",
  auditLogger("SUPPORT_TICKET_VIEW"),
  getSupportTicketById
);
router.post(
  "/support/tickets",
  auditLogger("SUPPORT_TICKET_CREATE"),
  createSupportTicket
);
router.put(
  "/support/tickets/:ticketId",
  auditLogger("SUPPORT_TICKET_UPDATE"),
  updateSupportTicket
);
router.post(
  "/support/tickets/:ticketId/messages",
  auditLogger("TICKET_MESSAGE_ADD"),
  addTicketMessage
);
router.put(
  "/support/tickets/:ticketId/resolve",
  auditLogger("SUPPORT_TICKET_RESOLVE"),
  resolveSupportTicket
);

// Communication and notification routes
router.post(
  "/communications/announcements",
  auditLogger("ANNOUNCEMENT_CREATE"),
  createAnnouncement
);
router.get(
  "/communications/announcements",
  auditLogger("ANNOUNCEMENTS_LIST"),
  getAllAnnouncements
);
router.get(
  "/communications/announcements/:announcementId",
  auditLogger("ANNOUNCEMENT_VIEW"),
  getAnnouncementById
);
router.put(
  "/communications/announcements/:announcementId",
  auditLogger("ANNOUNCEMENT_UPDATE"),
  updateAnnouncement
);
router.delete(
  "/communications/announcements/:announcementId",
  auditLogger("ANNOUNCEMENT_DELETE"),
  deleteAnnouncement
);

// Notification template routes
router.post(
  "/communications/templates",
  auditLogger("TEMPLATE_CREATE"),
  createNotificationTemplate
);
router.get(
  "/communications/templates",
  auditLogger("TEMPLATES_LIST"),
  getAllNotificationTemplates
);

// Targeted notification routes
router.post(
  "/communications/notifications",
  auditLogger("NOTIFICATION_SEND"),
  sendTargetedNotification
);
router.get(
  "/communications/notifications/:notificationId/stats",
  auditLogger("NOTIFICATION_STATS_VIEW"),
  getNotificationStats
);

// System health and monitoring routes
router.get(
  "/system/health",
  auditLogger("SYSTEM_HEALTH_VIEW"),
  getSystemHealth
);
router.get(
  "/system/database",
  auditLogger("DATABASE_HEALTH_VIEW"),
  getDatabaseHealth
);
router.get(
  "/system/api-metrics",
  auditLogger("API_METRICS_VIEW"),
  getApiMetrics
);
router.get(
  "/system/metrics/realtime",
  auditLogger("REALTIME_METRICS_VIEW"),
  getRealTimeSystemMetrics
);

// Data cleanup and storage routes
router.post(
  "/system/cleanup",
  auditLogger("DATA_CLEANUP_PERFORM"),
  performDataCleanup
);
router.get(
  "/system/storage",
  auditLogger("STORAGE_METRICS_VIEW"),
  getStorageMetrics
);

// Backup and restore routes
router.post("/system/backups", auditLogger("BACKUP_CREATE"), createDataBackup);
router.get("/system/backups", auditLogger("BACKUPS_LIST"), getAllBackups);
router.post(
  "/system/backups/:backupId/restore",
  auditLogger("BACKUP_RESTORE"),
  restoreFromBackup
);

// Maintenance window routes
router.post(
  "/system/maintenance",
  auditLogger("MAINTENANCE_SCHEDULE"),
  scheduleMaintenanceWindow
);
router.get(
  "/system/maintenance",
  auditLogger("MAINTENANCE_LIST"),
  getAllMaintenanceWindows
);
router.put(
  "/system/maintenance/:maintenanceId",
  auditLogger("MAINTENANCE_UPDATE"),
  updateMaintenanceWindow
);

export default router;

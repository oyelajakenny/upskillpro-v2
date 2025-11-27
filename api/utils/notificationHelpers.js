import { v4 as uuidv4 } from "uuid";
import {
  emitAdminNotification,
  emitSecurityAlert,
  emitActivityUpdate,
  emitDashboardMetrics,
} from "../src/websocket/socketHandler.js";

/**
 * Send a notification to all connected admin users
 * @param {Object} io - Socket.IO server instance
 * @param {Object} notificationData - Notification data
 */
export function sendAdminNotification(io, notificationData) {
  const notification = {
    id: uuidv4(),
    title: notificationData.title,
    message: notificationData.message,
    type: notificationData.type || "info", // success, warning, error, info
    read: false,
    timestamp: new Date().toISOString(),
    ...notificationData,
  };

  emitAdminNotification(io, notification);
  return notification;
}

/**
 * Send a security alert to all connected admin users
 * @param {Object} io - Socket.IO server instance
 * @param {Object} alertData - Alert data
 */
export function sendSecurityAlert(io, alertData) {
  const alert = {
    id: uuidv4(),
    title: alertData.title,
    description: alertData.description,
    priority: alertData.priority || "medium", // critical, high, medium, low
    category: alertData.category || "security",
    details: alertData.details || {},
    acknowledged: false,
    timestamp: new Date().toISOString(),
    ...alertData,
  };

  emitSecurityAlert(io, alert);
  return alert;
}

/**
 * Send an activity update to all connected admin users
 * @param {Object} io - Socket.IO server instance
 * @param {Object} activityData - Activity data
 */
export function sendActivityUpdate(io, activityData) {
  const activity = {
    id: uuidv4(),
    title: activityData.title,
    description: activityData.description,
    type: activityData.type, // user_registration, course_creation, enrollment, etc.
    timestamp: new Date().toISOString(),
    ...activityData,
  };

  emitActivityUpdate(io, activity);
  return activity;
}

/**
 * Send dashboard metrics update to all connected admin users
 * @param {Object} io - Socket.IO server instance
 * @param {Object} metricsData - Metrics data
 */
export function sendMetricsUpdate(io, metricsData) {
  emitDashboardMetrics(io, metricsData);
  return metricsData;
}

/**
 * Notification types enum
 */
export const NotificationType = {
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  INFO: "info",
};

/**
 * Alert priority enum
 */
export const AlertPriority = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

/**
 * Activity types enum
 */
export const ActivityType = {
  USER_REGISTRATION: "user_registration",
  COURSE_CREATION: "course_creation",
  ENROLLMENT: "enrollment",
  COURSE_APPROVAL: "course_approval",
  USER_ROLE_CHANGE: "user_role_change",
  SYSTEM_UPDATE: "system_update",
};

/**
 * Create a notification for user registration
 * @param {Object} io - Socket.IO server instance
 * @param {Object} user - User data
 */
export function notifyUserRegistration(io, user) {
  sendActivityUpdate(io, {
    title: "New User Registration",
    description: `${user.name} (${user.email}) has registered as a ${user.role}`,
    type: ActivityType.USER_REGISTRATION,
    userId: user.id,
  });

  sendAdminNotification(io, {
    title: "New User Registered",
    message: `${user.name} has joined the platform`,
    type: NotificationType.INFO,
  });
}

/**
 * Create a notification for course creation
 * @param {Object} io - Socket.IO server instance
 * @param {Object} course - Course data
 */
export function notifyCourseCreation(io, course) {
  sendActivityUpdate(io, {
    title: "New Course Created",
    description: `${course.title} by ${course.instructorName}`,
    type: ActivityType.COURSE_CREATION,
    courseId: course.id,
  });

  sendAdminNotification(io, {
    title: "New Course Pending Approval",
    message: `${course.title} is awaiting review`,
    type: NotificationType.INFO,
  });
}

/**
 * Create a notification for enrollment
 * @param {Object} io - Socket.IO server instance
 * @param {Object} enrollment - Enrollment data
 */
export function notifyEnrollment(io, enrollment) {
  sendActivityUpdate(io, {
    title: "New Enrollment",
    description: `${enrollment.studentName} enrolled in ${enrollment.courseName}`,
    type: ActivityType.ENROLLMENT,
    enrollmentId: enrollment.id,
  });
}

/**
 * Create a security alert for suspicious activity
 * @param {Object} io - Socket.IO server instance
 * @param {Object} data - Security event data
 */
export function alertSuspiciousActivity(io, data) {
  sendSecurityAlert(io, {
    title: "Suspicious Activity Detected",
    description: data.description,
    priority: AlertPriority.HIGH,
    category: "suspicious_activity",
    details: {
      ip: data.ip,
      user: data.user,
      action: data.action,
      timestamp: data.timestamp,
    },
  });
}

/**
 * Create a security alert for failed login attempts
 * @param {Object} io - Socket.IO server instance
 * @param {Object} data - Login attempt data
 */
export function alertFailedLogins(io, data) {
  sendSecurityAlert(io, {
    title: "Multiple Failed Login Attempts",
    description: `${data.attempts} failed login attempts detected`,
    priority: data.attempts > 10 ? AlertPriority.CRITICAL : AlertPriority.HIGH,
    category: "authentication",
    details: {
      ip: data.ip,
      user: data.email,
      attempts: data.attempts,
    },
  });
}

/**
 * Create a notification for system events
 * @param {Object} io - Socket.IO server instance
 * @param {Object} data - System event data
 */
export function notifySystemEvent(io, data) {
  sendAdminNotification(io, {
    title: data.title,
    message: data.message,
    type:
      data.severity === "error"
        ? NotificationType.ERROR
        : NotificationType.WARNING,
  });
}

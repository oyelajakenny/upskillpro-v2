import jwt from "jsonwebtoken";

/**
 * Initialize WebSocket server and handle connections
 * @param {Server} io - Socket.IO server instance
 */
export function initializeWebSocket(io) {
  // Middleware to authenticate WebSocket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Handle client connections
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id} (User: ${socket.userId})`);

    // Join admin room if user is super admin
    if (socket.userRole === "super_admin") {
      socket.join("admin-dashboard");
      console.log(`Admin user ${socket.userId} joined admin-dashboard room`);

      // Send initial connection confirmation
      socket.emit("connected", {
        message: "Connected to admin dashboard real-time updates",
        timestamp: new Date().toISOString(),
      });
    }

    // Handle subscription to specific metric updates
    socket.on("subscribe:metrics", (data) => {
      if (socket.userRole === "super_admin") {
        socket.join("metrics-updates");
        console.log(`Admin ${socket.userId} subscribed to metrics updates`);
        socket.emit("subscribed", { channel: "metrics", status: "active" });
      }
    });

    // Handle subscription to activity feed
    socket.on("subscribe:activity", (data) => {
      if (socket.userRole === "super_admin") {
        socket.join("activity-feed");
        console.log(`Admin ${socket.userId} subscribed to activity feed`);
        socket.emit("subscribed", { channel: "activity", status: "active" });
      }
    });

    // Handle subscription to notifications
    socket.on("subscribe:notifications", (data) => {
      if (socket.userRole === "super_admin") {
        socket.join("admin-notifications");
        console.log(`Admin ${socket.userId} subscribed to notifications`);
        socket.emit("subscribed", {
          channel: "notifications",
          status: "active",
        });
      }
    });

    // Handle subscription to security alerts
    socket.on("subscribe:security", (data) => {
      if (socket.userRole === "super_admin") {
        socket.join("security-alerts");
        console.log(`Admin ${socket.userId} subscribed to security alerts`);
        socket.emit("subscribed", { channel: "security", status: "active" });
      }
    });

    // Handle unsubscribe requests
    socket.on("unsubscribe", (data) => {
      const { channel } = data;
      const roomMap = {
        metrics: "metrics-updates",
        activity: "activity-feed",
        notifications: "admin-notifications",
        security: "security-alerts",
      };

      const room = roomMap[channel];
      if (room) {
        socket.leave(room);
        console.log(`Admin ${socket.userId} unsubscribed from ${channel}`);
        socket.emit("unsubscribed", { channel, status: "inactive" });
      }
    });

    // Handle ping for connection health check
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(
        `Client disconnected: ${socket.id} (User: ${socket.userId}), Reason: ${reason}`
      );
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log("WebSocket handlers initialized");
}

/**
 * Emit real-time dashboard metrics to all connected admins
 * @param {Server} io - Socket.IO server instance
 * @param {Object} metrics - Dashboard metrics data
 */
export function emitDashboardMetrics(io, metrics) {
  io.to("metrics-updates").emit("dashboard:metrics", {
    type: "metrics_update",
    data: metrics,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit activity feed update to all connected admins
 * @param {Server} io - Socket.IO server instance
 * @param {Object} activity - Activity data
 */
export function emitActivityUpdate(io, activity) {
  io.to("activity-feed").emit("dashboard:activity", {
    type: "activity_update",
    data: activity,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit notification to all connected admins
 * @param {Server} io - Socket.IO server instance
 * @param {Object} notification - Notification data
 */
export function emitAdminNotification(io, notification) {
  io.to("admin-notifications").emit("notification:new", {
    type: "notification",
    data: notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit security alert to all connected admins
 * @param {Server} io - Socket.IO server instance
 * @param {Object} alert - Security alert data
 */
export function emitSecurityAlert(io, alert) {
  io.to("security-alerts").emit("security:alert", {
    type: "security_alert",
    data: alert,
    priority: alert.priority || "medium",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit system health update to all connected admins
 * @param {Server} io - Socket.IO server instance
 * @param {Object} health - System health data
 */
export function emitSystemHealth(io, health) {
  io.to("admin-dashboard").emit("system:health", {
    type: "system_health",
    data: health,
    timestamp: new Date().toISOString(),
  });
}

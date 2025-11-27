import { io } from "socket.io-client";

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  /**
   * Connect to WebSocket server
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    const serverUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup default event handlers
   */
  setupEventHandlers() {
    this.socket.on("connect", () => {
      console.log("WebSocket connected:", this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit("connection:status", { connected: true });
    });

    this.socket.on("connected", (data) => {
      console.log("Server confirmation:", data);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.isConnected = false;
      this.emit("connection:status", { connected: false, reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      this.reconnectAttempts++;
      this.emit("connection:error", {
        error: error.message,
        attempts: this.reconnectAttempts,
      });
    });

    this.socket.on("subscribed", (data) => {
      console.log("Subscribed to channel:", data);
      this.emit("subscription:confirmed", data);
    });

    this.socket.on("unsubscribed", (data) => {
      console.log("Unsubscribed from channel:", data);
      this.emit("subscription:removed", data);
    });

    // Dashboard metrics updates
    this.socket.on("dashboard:metrics", (data) => {
      this.emit("metrics:update", data);
    });

    // Activity feed updates
    this.socket.on("dashboard:activity", (data) => {
      this.emit("activity:update", data);
    });

    // Notification updates
    this.socket.on("notification:new", (data) => {
      this.emit("notification:received", data);
    });

    // Security alerts
    this.socket.on("security:alert", (data) => {
      this.emit("security:alert", data);
    });

    // System health updates
    this.socket.on("system:health", (data) => {
      this.emit("system:health", data);
    });

    // Pong response for health check
    this.socket.on("pong", (data) => {
      this.emit("health:pong", data);
    });
  }

  /**
   * Subscribe to a specific channel
   * @param {string} channel - Channel name (metrics, activity, notifications, security)
   */
  subscribe(channel) {
    if (!this.socket?.connected) {
      console.error("Cannot subscribe: Socket not connected");
      return;
    }

    this.socket.emit(`subscribe:${channel}`, {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from a specific channel
   * @param {string} channel - Channel name
   */
  unsubscribe(channel) {
    if (!this.socket?.connected) {
      console.error("Cannot unsubscribe: Socket not connected");
      return;
    }

    this.socket.emit("unsubscribe", { channel });
  }

  /**
   * Send ping to check connection health
   */
  ping() {
    if (!this.socket?.connected) {
      console.error("Cannot ping: Socket not connected");
      return;
    }

    this.socket.emit("ping");
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to registered listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${event}:`, error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log("WebSocket disconnected");
    }
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected && this.socket?.connected;
  }
}

// Create singleton instance
const socketClient = new SocketClient();

export default socketClient;

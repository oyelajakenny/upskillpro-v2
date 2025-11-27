/**
 * Admin session management utilities
 * Handles session timeout, activity tracking, and admin-specific session logic
 */

const ADMIN_SESSION_CONFIG = {
  ACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  TOKEN_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  WARNING_BEFORE_TIMEOUT: 5 * 60 * 1000, // 5 minutes warning
};

class AdminSessionManager {
  constructor() {
    this.activityTimer = null;
    this.tokenCheckTimer = null;
    this.warningTimer = null;
    this.onSessionExpired = null;
    this.onSessionWarning = null;
    this.isActive = false;
  }

  /**
   * Initialize session management
   * @param {Function} onSessionExpired - Callback when session expires
   * @param {Function} onSessionWarning - Callback for session warning
   */
  init(onSessionExpired, onSessionWarning) {
    this.onSessionExpired = onSessionExpired;
    this.onSessionWarning = onSessionWarning;
    this.startActivityTracking();
    this.startTokenValidation();
    this.isActive = true;
  }

  /**
   * Start tracking user activity
   */
  startActivityTracking() {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      this.resetActivityTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Store event listeners for cleanup
    this.activityEvents = events;
    this.activityHandler = handleActivity;

    this.resetActivityTimer();
  }

  /**
   * Reset the activity timer
   */
  resetActivityTimer() {
    // Clear existing timers
    if (this.activityTimer) clearTimeout(this.activityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);

    // Set warning timer (5 minutes before timeout)
    this.warningTimer = setTimeout(() => {
      if (this.onSessionWarning) {
        this.onSessionWarning();
      }
    }, ADMIN_SESSION_CONFIG.ACTIVITY_TIMEOUT - ADMIN_SESSION_CONFIG.WARNING_BEFORE_TIMEOUT);

    // Set activity timeout timer
    this.activityTimer = setTimeout(() => {
      this.handleSessionTimeout("inactivity");
    }, ADMIN_SESSION_CONFIG.ACTIVITY_TIMEOUT);
  }

  /**
   * Start periodic token validation
   */
  startTokenValidation() {
    this.tokenCheckTimer = setInterval(() => {
      this.validateToken();
    }, ADMIN_SESSION_CONFIG.TOKEN_CHECK_INTERVAL);

    // Check immediately
    this.validateToken();
  }

  /**
   * Validate JWT token
   */
  async validateToken() {
    try {
      const token = this.getStoredToken();
      if (!token) {
        this.handleSessionTimeout("no-token");
        return;
      }

      // Check token expiry
      const tokenPayload = this.decodeToken(token);
      if (!tokenPayload) {
        this.handleSessionTimeout("invalid-token");
        return;
      }

      const currentTime = Date.now() / 1000;
      if (tokenPayload.exp && tokenPayload.exp < currentTime) {
        this.handleSessionTimeout("token-expired");
        return;
      }

      // Verify with backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        this.handleSessionTimeout("backend-verification-failed");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      this.handleSessionTimeout("validation-error");
    }
  }

  /**
   * Decode JWT token (basic decoding without verification)
   * @param {string} token - JWT token
   * @returns {object|null} Decoded payload or null if invalid
   */
  decodeToken(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  }

  /**
   * Get stored token from Redux store or localStorage
   * @returns {string|null} Token or null if not found
   */
  getStoredToken() {
    try {
      // Try to get from Redux store first
      if (typeof window !== "undefined" && window.__REDUX_STORE__) {
        const state = window.__REDUX_STORE__.getState();
        return state.auth?.token;
      }

      // Fallback to localStorage
      const persistedState = localStorage.getItem("persist:root");
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        const authState = JSON.parse(parsed.auth || "{}");
        return authState.token;
      }

      return null;
    } catch (error) {
      console.error("Error getting stored token:", error);
      return null;
    }
  }

  /**
   * Handle session timeout
   * @param {string} reason - Reason for timeout
   */
  handleSessionTimeout(reason) {
    if (this.onSessionExpired) {
      this.onSessionExpired(reason);
    }
    this.cleanup();
  }

  /**
   * Extend session (reset timers)
   */
  extendSession() {
    this.resetActivityTimer();
  }

  /**
   * Manually end session
   */
  endSession() {
    this.cleanup();
  }

  /**
   * Clean up timers and event listeners
   */
  cleanup() {
    // Clear timers
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.tokenCheckTimer) {
      clearInterval(this.tokenCheckTimer);
      this.tokenCheckTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    // Remove event listeners
    if (this.activityEvents && this.activityHandler) {
      this.activityEvents.forEach((event) => {
        document.removeEventListener(event, this.activityHandler, true);
      });
    }

    this.isActive = false;
  }

  /**
   * Check if session manager is active
   * @returns {boolean} True if active
   */
  isSessionActive() {
    return this.isActive;
  }
}

// Create singleton instance
const adminSessionManager = new AdminSessionManager();

export default adminSessionManager;

/**
 * Hook for using admin session management in React components
 */
export const useAdminSession = () => {
  return {
    extendSession: () => adminSessionManager.extendSession(),
    endSession: () => adminSessionManager.endSession(),
    isActive: () => adminSessionManager.isSessionActive(),
  };
};

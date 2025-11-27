import { AdminRepository } from "../../models/dynamodb/admin-repository.js";

/**
 * Get all system configuration settings
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export const getSystemSettings = async (req, res) => {
  try {
    const adminId = req.user.sub;

    // Log the access to system settings
    await AdminRepository.logAdminAction(adminId, "SYSTEM_SETTINGS_ACCESSED", {
      targetEntity: "SYSTEM_SETTINGS",
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    // Get system settings from repository
    const settings = await AdminRepository.getSystemSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system settings",
      error: error.message,
    });
  }
};

/**
 * Update platform settings
 * Requirements: 5.1, 5.2
 */
export const updatePlatformSettings = async (req, res) => {
  try {
    const adminId = req.user.sub;
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({
        success: false,
        message: "Settings object is required",
      });
    }

    // Validate platform settings
    const validationResult = validatePlatformSettings(settings);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid settings provided",
        errors: validationResult.errors,
      });
    }

    // Update platform settings
    const updatedSettings = await AdminRepository.updatePlatformSettings(
      settings,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating platform settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update platform settings",
      error: error.message,
    });
  }
};

/**
 * Update feature flags
 * Requirements: 5.2
 */
export const updateFeatureFlags = async (req, res) => {
  try {
    const adminId = req.user.sub;
    const { featureFlags } = req.body;

    if (!featureFlags || typeof featureFlags !== "object") {
      return res.status(400).json({
        success: false,
        message: "Feature flags object is required",
      });
    }

    // Update feature flags
    const updatedFlags = await AdminRepository.updateFeatureFlags(
      featureFlags,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Feature flags updated successfully",
      data: updatedFlags,
    });
  } catch (error) {
    console.error("Error updating feature flags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update feature flags",
      error: error.message,
    });
  }
};

/**
 * Update payment gateway settings
 * Requirements: 5.3, 5.4
 */
export const updatePaymentSettings = async (req, res) => {
  try {
    const adminId = req.user.sub;
    const { paymentSettings } = req.body;

    if (!paymentSettings || typeof paymentSettings !== "object") {
      return res.status(400).json({
        success: false,
        message: "Payment settings object is required",
      });
    }

    // Validate payment settings
    const validationResult = validatePaymentSettings(paymentSettings);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment settings provided",
        errors: validationResult.errors,
      });
    }

    // Update payment settings (sensitive data should be encrypted)
    const updatedSettings = await AdminRepository.updatePaymentSettings(
      paymentSettings,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Payment settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment settings",
      error: error.message,
    });
  }
};

/**
 * Update integration settings
 * Requirements: 5.4
 */
export const updateIntegrationSettings = async (req, res) => {
  try {
    const adminId = req.user.sub;
    const { integrationSettings } = req.body;

    if (!integrationSettings || typeof integrationSettings !== "object") {
      return res.status(400).json({
        success: false,
        message: "Integration settings object is required",
      });
    }

    // Update integration settings
    const updatedSettings = await AdminRepository.updateIntegrationSettings(
      integrationSettings,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Integration settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating integration settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update integration settings",
      error: error.message,
    });
  }
};

/**
 * Validate platform settings
 */
function validatePlatformSettings(settings) {
  const errors = [];

  // Validate platform name
  if (settings.platformName && typeof settings.platformName !== "string") {
    errors.push("Platform name must be a string");
  }

  // Validate maintenance mode
  if (
    settings.maintenanceMode &&
    typeof settings.maintenanceMode !== "boolean"
  ) {
    errors.push("Maintenance mode must be a boolean");
  }

  // Validate user registration
  if (
    settings.allowUserRegistration &&
    typeof settings.allowUserRegistration !== "boolean"
  ) {
    errors.push("Allow user registration must be a boolean");
  }

  // Validate course approval requirement
  if (
    settings.requireCourseApproval &&
    typeof settings.requireCourseApproval !== "boolean"
  ) {
    errors.push("Require course approval must be a boolean");
  }

  // Validate maximum file upload size
  if (
    settings.maxFileUploadSize &&
    (!Number.isInteger(settings.maxFileUploadSize) ||
      settings.maxFileUploadSize <= 0)
  ) {
    errors.push("Maximum file upload size must be a positive integer");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payment settings
 */
function validatePaymentSettings(settings) {
  const errors = [];

  // Validate payment provider
  if (
    settings.provider &&
    !["stripe", "paypal", "square"].includes(settings.provider)
  ) {
    errors.push("Payment provider must be one of: stripe, paypal, square");
  }

  // Validate currency
  if (settings.currency && typeof settings.currency !== "string") {
    errors.push("Currency must be a string");
  }

  // Validate commission rate
  if (
    settings.commissionRate &&
    (typeof settings.commissionRate !== "number" ||
      settings.commissionRate < 0 ||
      settings.commissionRate > 100)
  ) {
    errors.push("Commission rate must be a number between 0 and 100");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
/**
 * Get security policies
 * Requirements: 5.5, 6.1, 6.2, 6.3
 */
export const getSecurityPolicies = async (req, res) => {
  try {
    const adminId = req.user.sub;

    // Log the access to security policies
    await AdminRepository.logAdminAction(
      adminId,
      "SECURITY_POLICIES_ACCESSED",
      {
        targetEntity: "SYSTEM#SECURITY_POLICIES",
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
      }
    );

    // Get security policies from repository
    const policies = await AdminRepository.getSecurityPolicies();

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error) {
    console.error("Error fetching security policies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch security policies",
      error: error.message,
    });
  }
};

/**
 * Update security policies
 * Requirements: 5.5, 6.1, 6.2, 6.3
 */
export const updateSecurityPolicies = async (req, res) => {
  try {
    const adminId = req.user.sub;
    const { policies } = req.body;

    if (!policies || typeof policies !== "object") {
      return res.status(400).json({
        success: false,
        message: "Policies object is required",
      });
    }

    // Validate security policies
    const validationResult = validateSecurityPolicies(policies);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid security policies provided",
        errors: validationResult.errors,
      });
    }

    // Update security policies
    const updatedPolicies = await AdminRepository.updateSecurityPolicies(
      policies,
      adminId
    );

    res.status(200).json({
      success: true,
      message: "Security policies updated successfully",
      data: updatedPolicies,
    });
  } catch (error) {
    console.error("Error updating security policies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update security policies",
      error: error.message,
    });
  }
};

/**
 * Validate security policies
 */
function validateSecurityPolicies(policies) {
  const errors = [];

  // Validate password policy
  if (policies.passwordPolicy) {
    const { passwordPolicy } = policies;

    if (
      passwordPolicy.minLength &&
      (passwordPolicy.minLength < 6 || passwordPolicy.minLength > 50)
    ) {
      errors.push(
        "Password minimum length must be between 6 and 50 characters"
      );
    }

    if (
      passwordPolicy.maxAge &&
      (passwordPolicy.maxAge < 1 || passwordPolicy.maxAge > 365)
    ) {
      errors.push("Password maximum age must be between 1 and 365 days");
    }

    if (
      passwordPolicy.preventReuse &&
      (passwordPolicy.preventReuse < 1 || passwordPolicy.preventReuse > 20)
    ) {
      errors.push(
        "Password reuse prevention must be between 1 and 20 passwords"
      );
    }
  }

  // Validate session policy
  if (policies.sessionPolicy) {
    const { sessionPolicy } = policies;

    if (
      sessionPolicy.maxDuration &&
      (sessionPolicy.maxDuration < 1 || sessionPolicy.maxDuration > 168)
    ) {
      errors.push("Session maximum duration must be between 1 and 168 hours");
    }

    if (
      sessionPolicy.idleTimeout &&
      (sessionPolicy.idleTimeout < 0.5 || sessionPolicy.idleTimeout > 24)
    ) {
      errors.push("Session idle timeout must be between 0.5 and 24 hours");
    }

    if (
      sessionPolicy.maxConcurrentSessions &&
      (sessionPolicy.maxConcurrentSessions < 1 ||
        sessionPolicy.maxConcurrentSessions > 10)
    ) {
      errors.push("Maximum concurrent sessions must be between 1 and 10");
    }
  }

  // Validate access control
  if (policies.accessControl) {
    const { accessControl } = policies;

    if (
      accessControl.maxRequestsPerMinute &&
      (accessControl.maxRequestsPerMinute < 10 ||
        accessControl.maxRequestsPerMinute > 1000)
    ) {
      errors.push("Maximum requests per minute must be between 10 and 1000");
    }

    if (
      accessControl.maxFailedAttempts &&
      (accessControl.maxFailedAttempts < 3 ||
        accessControl.maxFailedAttempts > 20)
    ) {
      errors.push("Maximum failed attempts must be between 3 and 20");
    }

    if (
      accessControl.lockoutDuration &&
      (accessControl.lockoutDuration < 5 ||
        accessControl.lockoutDuration > 1440)
    ) {
      errors.push("Lockout duration must be between 5 and 1440 minutes");
    }

    if (accessControl.allowedIPs && Array.isArray(accessControl.allowedIPs)) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
      accessControl.allowedIPs.forEach((ip, index) => {
        if (!ipRegex.test(ip)) {
          errors.push(`Invalid IP address format at index ${index}: ${ip}`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

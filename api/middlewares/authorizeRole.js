import {
  USER_ROLES,
  hasAdminPrivileges,
  hasSuperAdminPrivileges,
} from "../utils/constants.js";

const authorizeRole = (requiredRole) => (req, res, next) => {
  if (!req.user) {
    console.log("User is not authenticated");
    return res.status(403).json({ error: "Access denied." });
  }

  const userRole = req.user.role;

  // Super admin has access to everything
  if (hasSuperAdminPrivileges(userRole)) {
    return next();
  }

  // Check if user has the exact required role
  if (userRole === requiredRole) {
    return next();
  }

  // For admin roles, check if user has admin privileges
  if (requiredRole === USER_ROLES.ADMIN && hasAdminPrivileges(userRole)) {
    return next();
  }

  console.log(
    `User does not have the required role: ${requiredRole}. User role: ${userRole}`
  );
  return res.status(403).json({
    error: "Access denied. Insufficient privileges.",
    required: requiredRole,
    current: userRole,
  });
};

/**
 * Middleware to authorize super admin access only
 */
export const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user) {
    console.log("User is not authenticated");
    return res.status(403).json({ error: "Access denied." });
  }

  if (!hasSuperAdminPrivileges(req.user.role)) {
    console.log(
      `Super admin access denied for user with role: ${req.user.role}`
    );
    return res.status(403).json({
      error: "Super admin access required.",
      current: req.user.role,
    });
  }

  next();
};

/**
 * Middleware to authorize admin or super admin access
 */
export const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    console.log("User is not authenticated");
    return res.status(403).json({ error: "Access denied." });
  }

  if (!hasAdminPrivileges(req.user.role)) {
    console.log(`Admin access denied for user with role: ${req.user.role}`);
    return res.status(403).json({
      error: "Admin access required.",
      current: req.user.role,
    });
  }

  next();
};

export default authorizeRole;

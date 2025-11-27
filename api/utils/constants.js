/**
 * Application constants and enums
 */

// User roles
export const USER_ROLES = {
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

// Valid roles array for validation
export const VALID_ROLES = Object.values(USER_ROLES);

/**
 * Validate if a role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} True if role is valid
 */
export function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

/**
 * Check if a role has admin privileges
 * @param {string} role - Role to check
 * @returns {boolean} True if role has admin privileges
 */
export function hasAdminPrivileges(role) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
}

/**
 * Check if a role has super admin privileges
 * @param {string} role - Role to check
 * @returns {boolean} True if role has super admin privileges
 */
export function hasSuperAdminPrivileges(role) {
  return role === USER_ROLES.SUPER_ADMIN;
}

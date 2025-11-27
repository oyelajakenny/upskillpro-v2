import {
  USER_ROLES,
  VALID_ROLES,
  isValidRole,
  hasAdminPrivileges,
  hasSuperAdminPrivileges,
} from "../utils/constants.js";

describe("Constants Unit Tests", () => {
  describe("USER_ROLES", () => {
    it("should have all expected roles", () => {
      expect(USER_ROLES.STUDENT).toBe("student");
      expect(USER_ROLES.INSTRUCTOR).toBe("instructor");
      expect(USER_ROLES.ADMIN).toBe("admin");
      expect(USER_ROLES.SUPER_ADMIN).toBe("super_admin");
    });
  });

  describe("VALID_ROLES", () => {
    it("should contain all user roles", () => {
      expect(VALID_ROLES).toContain("student");
      expect(VALID_ROLES).toContain("instructor");
      expect(VALID_ROLES).toContain("admin");
      expect(VALID_ROLES).toContain("super_admin");
      expect(VALID_ROLES).toHaveLength(4);
    });
  });

  describe("isValidRole", () => {
    it("should return true for valid roles", () => {
      expect(isValidRole("student")).toBe(true);
      expect(isValidRole("instructor")).toBe(true);
      expect(isValidRole("admin")).toBe(true);
      expect(isValidRole("super_admin")).toBe(true);
    });

    it("should return false for invalid roles", () => {
      expect(isValidRole("invalid")).toBe(false);
      expect(isValidRole("")).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
    });
  });

  describe("hasAdminPrivileges", () => {
    it("should return true for admin roles", () => {
      expect(hasAdminPrivileges("admin")).toBe(true);
      expect(hasAdminPrivileges("super_admin")).toBe(true);
    });

    it("should return false for non-admin roles", () => {
      expect(hasAdminPrivileges("student")).toBe(false);
      expect(hasAdminPrivileges("instructor")).toBe(false);
      expect(hasAdminPrivileges("invalid")).toBe(false);
    });
  });

  describe("hasSuperAdminPrivileges", () => {
    it("should return true only for super_admin role", () => {
      expect(hasSuperAdminPrivileges("super_admin")).toBe(true);
    });

    it("should return false for all other roles", () => {
      expect(hasSuperAdminPrivileges("admin")).toBe(false);
      expect(hasSuperAdminPrivileges("instructor")).toBe(false);
      expect(hasSuperAdminPrivileges("student")).toBe(false);
      expect(hasSuperAdminPrivileges("invalid")).toBe(false);
    });
  });
});

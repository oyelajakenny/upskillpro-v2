import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

// Mock DynamoDB client
const mockSend = jest.fn();
jest.unstable_mockModule("../config/dynamodb.js", () => ({
  default: { send: mockSend },
  TABLE_NAME: "LearningPlatform",
}));

// Mock uuid
jest.unstable_mockModule("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-123"),
}));

const JWT_SECRET = "test-secret";
process.env.JWT_SECRET = JWT_SECRET;

describe("Admin Security and Access Control Tests", () => {
  let app;
  let superAdminToken;
  let adminToken;
  let instructorToken;
  let studentToken;
  let expiredToken;
  let invalidToken;
  let AdminRepository;

  beforeAll(async () => {
    // Import after mocking
    const adminRepoModule = await import(
      "../models/dynamodb/admin-repository.js"
    );
    AdminRepository = adminRepoModule.AdminRepository;

    // Import app
    const appModule = await import("../src/index.js");
    app = appModule.default;

    // Create test tokens with different roles
    superAdminToken = jwt.sign(
      {
        sub: "super-admin-123",
        role: "super_admin",
        email: "superadmin@test.com",
        name: "Super Admin",
        isAdmin: true,
        isSuperAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      {
        sub: "admin-123",
        role: "admin",
        email: "admin@test.com",
        name: "Admin User",
        isAdmin: true,
        isSuperAdmin: false,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    instructorToken = jwt.sign(
      {
        sub: "instructor-123",
        role: "instructor",
        email: "instructor@test.com",
        name: "Instructor User",
        isAdmin: false,
        isSuperAdmin: false,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    studentToken = jwt.sign(
      {
        sub: "student-123",
        role: "student",
        email: "student@test.com",
        name: "Student User",
        isAdmin: false,
        isSuperAdmin: false,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create expired token
    expiredToken =
import { jest } from "@jest/globals";

// Create mock send function
const mockSend = jest.fn();

// Mock DynamoDB client before importing
jest.unstable_mockModule("../config/dynamodb.js", () => ({
  default: {
    send: mockSend,
  },
  TABLE_NAME: "LearningPlatform",
}));

// Import after mocking
const { RatingRepository } = await import(
  "../models/dynamodb/rating-repository.js"
);
const dynamoDb = (await import("../config/dynamodb.js")).default;
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } =
  await import("@aws-sdk/lib-dynamodb");

describe("RatingRepository Unit Tests", () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  describe("create", () => {
    it("should create a new rating with all fields", async () => {
      const mockRating = {
        userId: "user-123",
        courseId: "course-456",
        rating: 5,
        review: "Great course!",
        userName: "John Doe",
        createdAt: "2025-11-14T10:00:00Z",
      };

      mockSend.mockResolvedValueOnce({});

      const result = await RatingRepository.create(mockRating);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
      expect(result).toMatchObject({
        PK: "USER#user-123",
        SK: "RATING#course-456",
        GSI6PK: "COURSE#course-456",
        entityType: "Rating",
        userId: "user-123",
        courseId: "course-456",
        rating: 5,
        review: "Great course!",
        userName: "John Doe",
      });
    });

    it("should create a rating without review", async () => {
      const mockRating = {
        userId: "user-123",
        courseId: "course-456",
        rating: 4,
        userName: "Jane Smith",
        createdAt: "2025-11-14T10:00:00Z",
      };

      mockSend.mockResolvedValueOnce({});

      const result = await RatingRepository.create(mockRating);

      expect(result.review).toBe("");
      expect(result.rating).toBe(4);
    });

    it("should generate timestamp if not provided", async () => {
      const mockRating = {
        userId: "user-123",
        courseId: "course-456",
        rating: 3,
        userName: "Bob Wilson",
      };

      mockSend.mockResolvedValueOnce({});

      const result = await RatingRepository.create(mockRating);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt).toBe(result.updatedAt);
    });
  });

  describe("findByUserAndCourse", () => {
    it("should find a rating by user and course", async () => {
      const mockRating = {
        PK: "USER#user-123",
        SK: "RATING#course-456",
        userId: "user-123",
        courseId: "course-456",
        rating: 5,
        review: "Excellent!",
      };

      mockSend.mockResolvedValueOnce({ Item: mockRating });

      const result = await RatingRepository.findByUserAndCourse(
        "user-123",
        "course-456"
      );

      expect(mockSend).toHaveBeenCalledWith(expect.any(GetCommand));
      expect(result).toEqual(mockRating);
    });

    it("should return null if rating not found", async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await RatingRepository.findByUserAndCourse(
        "user-123",
        "course-456"
      );

      expect(result).toBeNull();
    });
  });

  describe("findByCourse", () => {
    it("should find all ratings for a course with pagination", async () => {
      const mockRatings = [
        { userId: "user-1", rating: 5, review: "Great!" },
        { userId: "user-2", rating: 4, review: "Good" },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockRatings,
        LastEvaluatedKey: { PK: "USER#user-2" },
      });

      const result = await RatingRepository.findByCourse("course-456", {
        limit: 10,
      });

      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(result.ratings).toEqual(mockRatings);
      expect(result.hasMore).toBe(true);
      expect(result.lastEvaluatedKey).toEqual({ PK: "USER#user-2" });
    });

    it("should handle empty results", async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await RatingRepository.findByCourse("course-456");

      expect(result.ratings).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it("should use provided pagination key", async () => {
      const lastKey = { PK: "USER#user-5", SK: "RATING#course-456" };

      mockSend.mockResolvedValueOnce({ Items: [] });

      await RatingRepository.findByCourse("course-456", {
        lastEvaluatedKey: lastKey,
      });

      const callArgs = mockSend.mock.calls[0][0].input;
      expect(callArgs.ExclusiveStartKey).toEqual(lastKey);
    });
  });

  describe("update", () => {
    it("should update rating and review", async () => {
      const updatedRating = {
        userId: "user-123",
        courseId: "course-456",
        rating: 4,
        review: "Updated review",
        updatedAt: "2025-11-14T12:00:00Z",
      };

      mockSend.mockResolvedValueOnce({
        Attributes: updatedRating,
      });

      const result = await RatingRepository.update("user-123", "course-456", {
        rating: 4,
        review: "Updated review",
        updatedAt: "2025-11-14T12:00:00Z",
      });

      expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
      expect(result).toEqual(updatedRating);
    });

    it("should update only rating", async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: { rating: 3 },
      });

      await RatingRepository.update("user-123", "course-456", { rating: 3 });

      const callArgs = mockSend.mock.calls[0][0].input;
      expect(callArgs.UpdateExpression).toContain("#rating = :rating");
    });

    it("should generate timestamp if not provided", async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: {},
      });

      await RatingRepository.update("user-123", "course-456", { rating: 5 });

      const callArgs = mockSend.mock.calls[0][0].input;
      expect(callArgs.ExpressionAttributeNames).toHaveProperty("#updatedAt");
    });
  });

  describe("delete", () => {
    it("should delete a rating", async () => {
      mockSend.mockResolvedValueOnce({});

      await RatingRepository.delete("user-123", "course-456");

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteCommand));
      const callArgs = mockSend.mock.calls[0][0].input;
      expect(callArgs.Key).toEqual({
        PK: "USER#user-123",
        SK: "RATING#course-456",
      });
    });
  });

  describe("calculateAggregates", () => {
    it("should calculate average rating and count", async () => {
      const mockRatings = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
      ];

      mockSend.mockResolvedValueOnce({ Items: mockRatings });

      const result = await RatingRepository.calculateAggregates("course-456");

      expect(result.averageRating).toBe(4.3); // (5+4+5+3)/4 = 4.25 rounded to 4.3
      expect(result.ratingCount).toBe(4);
    });

    it("should return zero for course with no ratings", async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await RatingRepository.calculateAggregates("course-456");

      expect(result.averageRating).toBe(0);
      expect(result.ratingCount).toBe(0);
    });

    it("should round average to one decimal place", async () => {
      const mockRatings = [{ rating: 5 }, { rating: 5 }, { rating: 4 }];

      mockSend.mockResolvedValueOnce({ Items: mockRatings });

      const result = await RatingRepository.calculateAggregates("course-456");

      expect(result.averageRating).toBe(4.7); // (5+5+4)/3 = 4.666... rounded to 4.7
    });
  });

  describe("getRatingDistribution", () => {
    it("should count ratings by star value", async () => {
      const mockRatings = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 5 },
        { rating: 2 },
      ];

      mockSend.mockResolvedValueOnce({ Items: mockRatings });

      const result = await RatingRepository.getRatingDistribution("course-456");

      expect(result).toEqual({
        1: 0,
        2: 1,
        3: 1,
        4: 1,
        5: 3,
      });
    });

    it("should return all zeros for course with no ratings", async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await RatingRepository.getRatingDistribution("course-456");

      expect(result).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it("should ignore invalid rating values", async () => {
      const mockRatings = [
        { rating: 5 },
        { rating: 0 }, // Invalid
        { rating: 6 }, // Invalid
        { rating: 4 },
      ];

      mockSend.mockResolvedValueOnce({ Items: mockRatings });

      const result = await RatingRepository.getRatingDistribution("course-456");

      expect(result).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 1,
      });
    });
  });
});

import dynamoDb, { TABLE_NAME } from "../../config/dynamodb.js";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

export class RatingRepository {
  /**
   * Create a new rating
   * @param {Object} params - Rating parameters
   * @param {string} params.userId - User ID
   * @param {string} params.courseId - Course ID
   * @param {number} params.rating - Rating value (1-5)
   * @param {string} params.review - Optional review text
   * @param {string} params.userName - User's name
   * @param {string} params.createdAt - Creation timestamp
   * @returns {Promise<Object>} Created rating item
   */
  static async create({
    userId,
    courseId,
    rating,
    review,
    userName,
    createdAt,
  }) {
    const timestamp = createdAt || new Date().toISOString();

    const item = {
      PK: `USER#${userId}`,
      SK: `RATING#${courseId}`,
      GSI6PK: `COURSE#${courseId}`,
      GSI6SK: `RATING#${timestamp}#${userId}`,
      entityType: "Rating",
      userId,
      courseId,
      userName,
      rating,
      review: review || "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return item;
  }

  /**
   * Find a specific user's rating for a course
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object|null>} Rating item or null if not found
   */
  static async findByUserAndCourse(userId, courseId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `RATING#${courseId}`,
        },
      })
    );

    return result.Item || null;
  }

  /**
   * Get all ratings for a course (paginated)
   * @param {string} courseId - Course ID
   * @param {Object} options - Pagination options
   * @param {number} options.limit - Maximum number of items to return
   * @param {Object} options.lastEvaluatedKey - Pagination token from previous query
   * @returns {Promise<Object>} Object containing ratings array and pagination info
   */
  static async findByCourse(
    courseId,
    { limit = 10, lastEvaluatedKey = null } = {}
  ) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: "GSI6",
      KeyConditionExpression: "GSI6PK = :courseId",
      ExpressionAttributeValues: {
        ":courseId": `COURSE#${courseId}`,
      },
      ScanIndexForward: false, // newest first
      Limit: limit,
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const result = await dynamoDb.send(new QueryCommand(params));

    return {
      ratings: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      hasMore: !!result.LastEvaluatedKey,
    };
  }

  /**
   * Update an existing rating
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @param {Object} updates - Fields to update
   * @param {number} updates.rating - New rating value
   * @param {string} updates.review - New review text
   * @param {string} updates.updatedAt - Update timestamp
   * @returns {Promise<Object>} Updated rating item
   */
  static async update(userId, courseId, { rating, review, updatedAt }) {
    const timestamp = updatedAt || new Date().toISOString();

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (rating !== undefined) {
      updateExpressions.push("#rating = :rating");
      expressionAttributeNames["#rating"] = "rating";
      expressionAttributeValues[":rating"] = rating;
    }

    if (review !== undefined) {
      updateExpressions.push("#review = :review");
      expressionAttributeNames["#review"] = "review";
      expressionAttributeValues[":review"] = review;
    }

    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = timestamp;

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `RATING#${courseId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  }

  /**
   * Delete a rating
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Promise<void>}
   */
  static async delete(userId, courseId) {
    await dynamoDb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `RATING#${courseId}`,
        },
      })
    );
  }

  /**
   * Calculate aggregate statistics for a course
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Object containing averageRating and ratingCount
   */
  static async calculateAggregates(courseId) {
    // Query all ratings for the course using GSI6
    const params = {
      TableName: TABLE_NAME,
      IndexName: "GSI6",
      KeyConditionExpression: "GSI6PK = :courseId",
      ExpressionAttributeValues: {
        ":courseId": `COURSE#${courseId}`,
      },
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    const ratings = result.Items || [];

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        ratingCount: 0,
      };
    }

    const totalRating = ratings.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = Math.round((totalRating / ratings.length) * 10) / 10; // Round to 1 decimal

    return {
      averageRating,
      ratingCount: ratings.length,
    };
  }

  /**
   * Get rating distribution (count of ratings by star value 1-5)
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Object with keys 1-5 and their counts
   */
  static async getRatingDistribution(courseId) {
    // Query all ratings for the course using GSI6
    const params = {
      TableName: TABLE_NAME,
      IndexName: "GSI6",
      KeyConditionExpression: "GSI6PK = :courseId",
      ExpressionAttributeValues: {
        ":courseId": `COURSE#${courseId}`,
      },
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    const ratings = result.Items || [];

    // Initialize distribution with zeros
    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    // Count ratings by star value
    ratings.forEach((item) => {
      if (item.rating >= 1 && item.rating <= 5) {
        distribution[item.rating]++;
      }
    });

    return distribution;
  }
}

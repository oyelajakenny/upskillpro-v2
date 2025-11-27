import dynamoDb, { TABLE_NAME } from "../../config/dynamodb.js";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  BatchGetCommand,
  DeleteCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { CategoryRepository } from "./category-repository.js";

export class CourseRepository {
  static async create({
    title,
    description,
    instructorId,
    instructorName,
    instructorEmail,
    price,
    imageKey,
    createdAt,
    categoryId,
    categoryName,
  }) {
    // Validate categoryId exists if provided
    if (categoryId) {
      const category = await CategoryRepository.findById(categoryId);
      if (!category) {
        throw new Error(`Category with ID ${categoryId} not found`);
      }
      // Use the category name from the database if not provided
      if (!categoryName) {
        categoryName = category.name;
      }
    }

    const courseId = uuidv4();
    const timestamp = createdAt || new Date().toISOString();

    const item = {
      PK: `COURSE#${courseId}`,
      SK: "METADATA",
      GSI1PK: `INSTRUCTOR#${instructorId}`,
      GSI1SK: `COURSE#${timestamp}#${courseId}`,
      GSI3PK: "COURSE",
      GSI3SK: `PRICE#${String(price).padStart(10, "0")}#${courseId}`,
      entityType: "Course",
      courseId,
      title,
      description,
      instructorId,
      instructorName,
      instructorEmail,
      price,
      imageKey,
      createdAt: timestamp,
    };

    // Add category fields if provided
    if (categoryId && categoryName) {
      item.categoryId = categoryId;
      item.categoryName = categoryName;
      item.GSI5PK = `CATEGORY#${categoryId}`;
      item.GSI5SK = `COURSE#${timestamp}#${courseId}`;
    }

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return item;
  }

  static async findById(courseId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `COURSE#${courseId}`,
          SK: "METADATA",
        },
      })
    );

    return result.Item || null;
  }

  static async findByInstructor(instructorId) {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :instructorId",
        ExpressionAttributeValues: {
          ":instructorId": `INSTRUCTOR#${instructorId}`,
        },
        ScanIndexForward: false, // newest first
      })
    );

    return result.Items || [];
  }

  static async findByCategory(
    categoryId,
    { sortBy = "createdAt", sortDir = "desc" } = {}
  ) {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI5",
        KeyConditionExpression: "GSI5PK = :categoryId",
        ExpressionAttributeValues: {
          ":categoryId": `CATEGORY#${categoryId}`,
        },
        ScanIndexForward: sortDir === "asc",
      })
    );

    let courses = result.Items || [];

    // Sort by different fields if needed
    if (sortBy === "price") {
      courses.sort((a, b) => {
        const comparison = a.price - b.price;
        return sortDir === "asc" ? comparison : -comparison;
      });
    } else if (sortBy === "title") {
      courses.sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return sortDir === "asc" ? comparison : -comparison;
      });
    }
    // Default sort by createdAt is handled by ScanIndexForward

    return courses;
  }

  static async findAll({
    sortBy = "price",
    sortDir = "asc",
    titleFilter,
    categoryId,
  }) {
    // If categoryId is provided, use findByCategory internally
    if (categoryId) {
      let courses = await this.findByCategory(categoryId, { sortBy, sortDir });

      // Apply title filter if provided
      if (titleFilter) {
        const lowerFilter = titleFilter.toLowerCase();
        courses = courses.filter((course) =>
          course.title.toLowerCase().includes(lowerFilter)
        );
      }

      return courses;
    }

    // Original implementation for all courses
    let keyConditionExpression = "GSI3PK = :courseType";
    const expressionAttributeValues = {
      ":courseType": "COURSE",
    };

    // For title filtering, we'll need to scan or use a different approach
    // DynamoDB doesn't support LIKE queries on sort keys efficiently
    // We'll fetch all and filter in memory for now
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI3",
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ScanIndexForward: sortDir === "asc",
      })
    );

    let courses = result.Items || [];

    // Filter by title if provided
    if (titleFilter) {
      const lowerFilter = titleFilter.toLowerCase();
      courses = courses.filter((course) =>
        course.title.toLowerCase().includes(lowerFilter)
      );
    }

    // Sort by different fields if needed
    if (sortBy === "createdAt") {
      courses.sort((a, b) => {
        const comparison = new Date(a.createdAt) - new Date(b.createdAt);
        return sortDir === "asc" ? comparison : -comparison;
      });
    } else if (sortBy === "title") {
      courses.sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return sortDir === "asc" ? comparison : -comparison;
      });
    }

    return courses;
  }

  static async update(courseId, updates) {
    // Validate categoryId if it's being updated
    if (updates.categoryId) {
      const category = await CategoryRepository.findById(updates.categoryId);
      if (!category) {
        throw new Error(`Category with ID ${updates.categoryId} not found`);
      }
      // Automatically set categoryName if not provided
      if (!updates.categoryName) {
        updates.categoryName = category.name;
      }

      // Get the current course to retrieve createdAt for GSI5SK
      const currentCourse = await this.findById(courseId);
      if (currentCourse) {
        // Update GSI5 attributes when category changes
        updates.GSI5PK = `CATEGORY#${updates.categoryId}`;
        updates.GSI5SK = `COURSE#${currentCourse.createdAt}#${courseId}`;
      }
    }

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      updateExpressions.push(`#field${index} = :value${index}`);
      expressionAttributeNames[`#field${index}`] = key;
      expressionAttributeValues[`:value${index}`] = updates[key];
    });

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `COURSE#${courseId}`,
          SK: "METADATA",
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  }

  static async findByIdWithLectures(courseId) {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `COURSE#${courseId}`,
        },
      })
    );

    const items = result.Items || [];
    const course = items.find((item) => item.SK === "METADATA");
    const lectures = items.filter((item) => item.SK.startsWith("LECTURE#"));

    if (!course) return null;

    return {
      ...course,
      lectures,
    };
  }

  /**
   * Update course rating aggregates
   * @param {string} courseId - Course ID
   * @param {Object} aggregates - Rating aggregate data
   * @param {number} aggregates.averageRating - Average rating value
   * @param {number} aggregates.ratingCount - Total number of ratings
   * @param {Object} aggregates.ratingDistribution - Distribution of ratings by star value (1-5)
   * @returns {Promise<Object>} Updated course item
   */
  static async updateRatingAggregates(
    courseId,
    { averageRating, ratingCount, ratingDistribution }
  ) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (averageRating !== undefined) {
      updateExpressions.push("#averageRating = :averageRating");
      expressionAttributeNames["#averageRating"] = "averageRating";
      expressionAttributeValues[":averageRating"] = averageRating;
    }

    if (ratingCount !== undefined) {
      updateExpressions.push("#ratingCount = :ratingCount");
      expressionAttributeNames["#ratingCount"] = "ratingCount";
      expressionAttributeValues[":ratingCount"] = ratingCount;
    }

    if (ratingDistribution !== undefined) {
      updateExpressions.push("#ratingDistribution = :ratingDistribution");
      expressionAttributeNames["#ratingDistribution"] = "ratingDistribution";
      expressionAttributeValues[":ratingDistribution"] = ratingDistribution;
    }

    if (updateExpressions.length === 0) {
      throw new Error("No aggregate data provided for update");
    }

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `COURSE#${courseId}`,
          SK: "METADATA",
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
   * Delete a course and all its related data (lectures, enrollments, ratings)
   * @param {string} courseId - Course ID to delete
   * @returns {Promise<void>}
   */
  static async delete(courseId) {
    // First, get all items related to this course
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `COURSE#${courseId}`,
        },
      })
    );

    const items = result.Items || [];

    if (items.length === 0) {
      throw new Error("Course not found");
    }

    // Delete all items in batches (DynamoDB BatchWrite limit is 25 items)
    const deleteRequests = items.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      },
    }));

    // Process in batches of 25
    for (let i = 0; i < deleteRequests.length; i += 25) {
      const batch = deleteRequests.slice(i, i + 25);
      await dynamoDb.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: batch,
          },
        })
      );
    }

    // Note: Enrollments and ratings are stored with different PK patterns
    // They need to be deleted separately if needed
    // For now, we're only deleting the course and its lectures
  }
}

import dynamoDb, { TABLE_NAME } from "../../config/dynamodb.js";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";

export class EnrollmentRepository {
  static async create({
    userId,
    courseId,
    courseTitle,
    coursePrice,
    courseImageKey,
    progress = [],
    createdAt,
  }) {
    const timestamp = createdAt || new Date().toISOString();

    const item = {
      PK: `USER#${userId}`,
      SK: `ENROLLMENT#${courseId}`,
      GSI2PK: `COURSE#${courseId}`,
      GSI2SK: `ENROLLMENT#${userId}`,
      entityType: "Enrollment",
      userId,
      courseId,
      courseTitle,
      coursePrice,
      courseImageKey,
      progress,
      createdAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      }),
    );

    return item;
  }

  static async findByUserAndCourse(userId, courseId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `ENROLLMENT#${courseId}`,
        },
      }),
    );

    return result.Item || null;
  }

  static async findByUser(userId) {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "ENROLLMENT#",
        },
      }),
    );

    return result.Items || [];
  }

  static async findByCourse(courseId) {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :courseId",
        ExpressionAttributeValues: {
          ":courseId": `COURSE#${courseId}`,
        },
      }),
    );

    return result.Items || [];
  }

  static async countByCourse(courseId) {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :courseId",
        ExpressionAttributeValues: {
          ":courseId": `COURSE#${courseId}`,
        },
        Select: "COUNT",
      }),
    );

    return result.Count || 0;
  }

  static async updateProgress(
    userId,
    courseId,
    progress,
    { completedAt, clearCompletedAt = false } = {},
  ) {
    let updateExpression = "SET progress = :progress";
    const expressionAttributeValues = {
      ":progress": progress,
    };

    if (completedAt) {
      updateExpression += ", completedAt = :completedAt";
      expressionAttributeValues[":completedAt"] = completedAt;
    }

    if (clearCompletedAt) {
      updateExpression += " REMOVE completedAt";
    }

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `ENROLLMENT#${courseId}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes;
  }

  static async getInstructorRevenue(instructorId, courses) {
    // Get enrollment counts for all instructor's courses
    const revenuePromises = courses.map(async (course) => {
      const count = await this.countByCourse(course.courseId);
      return {
        courseId: course.courseId,
        title: course.title,
        price: course.price,
        enrollmentCount: count,
        totalRevenue: count * course.price,
      };
    });

    return await Promise.all(revenuePromises);
  }
}

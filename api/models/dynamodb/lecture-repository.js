import dynamoDb, { TABLE_NAME } from "../../config/dynamodb.js";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export class LectureRepository {
  static async create({
    courseId,
    title,
    videoUrl,
    createdAt,
    durationSeconds,
  }) {
    const lectureId = uuidv4();
    const item = {
      PK: `COURSE#${courseId}`,
      SK: `LECTURE#${lectureId}`,
      entityType: "Lecture",
      lectureId,
      courseId,
      title,
      videoUrl,
      createdAt: createdAt || new Date().toISOString(),
      durationSeconds: durationSeconds ?? null,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );

    return item;
  }

  static async findByCourse(courseId) {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `COURSE#${courseId}`,
          ":sk": "LECTURE#",
        },
      }),
    );

    return result.Items || [];
  }

  static async findById(courseId, lectureId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `COURSE#${courseId}`,
          SK: `LECTURE#${lectureId}`,
        },
      }),
    );

    return result.Item || null;
  }

  static async update(courseId, lectureId, updates) {
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
          SK: `LECTURE#${lectureId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes;
  }
}

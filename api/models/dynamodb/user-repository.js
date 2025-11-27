import dynamoDb, { TABLE_NAME } from "../../config/dynamodb.js";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { validateUserRole } from "../../utils/validation.js";
import { USER_ROLES } from "../../utils/constants.js";

export class UserRepository {
  static async create({ name, email, password, role, createdAt }) {
    // Validate role
    const roleValidation = validateUserRole(role);
    if (!roleValidation.isValid) {
      throw new Error(roleValidation.error);
    }

    const userId = uuidv4();
    const item = {
      PK: `USER#${userId}`,
      SK: "PROFILE",
      GSI4PK: `EMAIL#${email}`,
      GSI4SK: "USER",
      entityType: "User",
      userId,
      name,
      email,
      password,
      role,
      createdAt: createdAt || new Date().toISOString(),
      // Add additional fields for admin tracking
      accountStatus: "active",
      lastLoginAt: null,
      loginCount: 0,
      failedLoginAttempts: 0,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );

    return item;
  }

  static async findById(userId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE",
        },
      })
    );

    return result.Item || null;
  }

  static async findByEmail(email) {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI4",
        KeyConditionExpression: "GSI4PK = :email",
        ExpressionAttributeValues: {
          ":email": `EMAIL#${email}`,
        },
      })
    );

    return result.Items?.[0] || null;
  }

  static async update(userId, updates) {
    // Validate role if it's being updated
    if (updates.role) {
      const roleValidation = validateUserRole(updates.role);
      if (!roleValidation.isValid) {
        throw new Error(roleValidation.error);
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
          PK: `USER#${userId}`,
          SK: "PROFILE",
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
   * Update user login tracking information
   * @param {string} userId - User ID
   * @param {boolean} success - Whether login was successful
   * @returns {Promise<Object>} Updated user object
   */
  static async updateLoginTracking(userId, success = true) {
    const now = new Date().toISOString();

    if (success) {
      const result = await dynamoDb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: "PROFILE",
          },
          UpdateExpression:
            "SET lastLoginAt = :now, loginCount = if_not_exists(loginCount, :zero) + :one, failedLoginAttempts = :zero",
          ExpressionAttributeValues: {
            ":now": now,
            ":one": 1,
            ":zero": 0,
          },
          ReturnValues: "ALL_NEW",
        })
      );
      return result.Attributes;
    } else {
      const result = await dynamoDb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: "PROFILE",
          },
          UpdateExpression:
            "SET failedLoginAttempts = if_not_exists(failedLoginAttempts, :zero) + :one",
          ExpressionAttributeValues: {
            ":one": 1,
            ":zero": 0,
          },
          ReturnValues: "ALL_NEW",
        })
      );
      return result.Attributes;
    }
  }
}

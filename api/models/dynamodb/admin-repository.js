import dynamoDb, { TABLE_NAME } from "../../config/dynamodb.js";
import {
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { USER_ROLES } from "../../utils/constants.js";
import { v4 as uuidv4 } from "uuid";

export class AdminRepository {
  /**
   * Get all users with pagination and filtering
   * 
   * IMPORTANT: When using Scan with FilterExpression, the Limit parameter applies
   * to items SCANNED, not items RETURNED after filtering. This means if you set
   * limit=50, DynamoDB might scan 50 items but only return 10 users after filtering.
   * 
   * Solution: Continue scanning until we collect the desired number of users,
   * or until there are no more items to scan.
   * 
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of users to return (after filtering)
   * @param {string} options.lastEvaluatedKey - Pagination key
   * @param {string} options.role - Filter by role
   * @param {string} options.accountStatus - Filter by account status
   * @returns {Promise<Object>} Users and pagination info
   */
  static async getAllUsers({
    limit = 10,
    lastEvaluatedKey,
    role,
    accountStatus,
  } = {}) {
    // Build filter expression
    let filterExpression = "entityType = :entityType";
    const expressionAttributeValues = {
      ":entityType": "User",
    };
    const expressionAttributeNames = {};

    // Add role filter if specified
    if (role) {
      filterExpression += " AND #role = :role";
      expressionAttributeNames["#role"] = "role";
      expressionAttributeValues[":role"] = role;
    }

    // Add account status filter if specified
    if (accountStatus) {
      filterExpression += " AND accountStatus = :accountStatus";
      expressionAttributeValues[":accountStatus"] = accountStatus;
    }

    // Collect users until we reach the limit
    const allUsers = [];
    let currentLastEvaluatedKey = lastEvaluatedKey
      ? JSON.parse(lastEvaluatedKey)
      : undefined;
    let scannedCount = 0;
    const maxScans = 10; // Prevent infinite loops - max 10 scan iterations
    let scanIterations = 0;

    // Continue scanning until we have enough users or no more items
    while (allUsers.length < limit && scanIterations < maxScans) {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        // Use a larger scan limit to reduce number of round trips
        // Scan 5x the desired limit to increase chances of getting enough users
        Limit: Math.max(limit * 5, 250),
      };

      // Add expression attribute names if we have role filter
      if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames;
      }

      // Add pagination key if we have one
      if (currentLastEvaluatedKey) {
        params.ExclusiveStartKey = currentLastEvaluatedKey;
      }//

      const result = await dynamoDb.send(new ScanCommand(params));
      scannedCount += result.ScannedCount || 0;

      // Add filtered users to our collection
      if (result.Items && result.Items.length > 0) {
        allUsers.push(...result.Items);
      }

      // Check if we have more items to scan
      if (!result.LastEvaluatedKey) {
        // No more items to scan
        break;
      }

      // Update pagination key for next iteration
      currentLastEvaluatedKey = result.LastEvaluatedKey;

      // If we have enough users, break early
      if (allUsers.length >= limit) {
        break;
      }

      scanIterations++;
    }

    // Slice to exact limit if we collected more than needed
    const users = allUsers.slice(0, limit);
    const hasMore = allUsers.length > limit || currentLastEvaluatedKey !== undefined;

    return {
      users,
      lastEvaluatedKey: hasMore && currentLastEvaluatedKey
        ? JSON.stringify(currentLastEvaluatedKey)
        : null,
      count: users.length,
      scannedCount, // Total items scanned (for debugging/monitoring)
    };
  }

  /**
   * Update user role (admin operation)
   * @param {string} userId - User ID to update
   * @param {string} newRole - New role to assign
   * @param {string} adminId - ID of admin performing the action
   * @param {string} reason - Reason for role change
   * @returns {Promise<Object>} Updated user object
   */
  static async updateUserRole(userId, newRole, adminId, reason = null) {
    // Get current user data for audit trail
    const currentUser = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE",
        },
      })
    );

    const previousRole = currentUser.Item?.role;

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE",
        },
        UpdateExpression:
          "SET #role = :newRole, updatedAt = :now, updatedBy = :adminId",
        ExpressionAttributeNames: {
          "#role": "role",
        },
        ExpressionAttributeValues: {
          ":newRole": newRole,
          ":now": new Date().toISOString(),
          ":adminId": adminId,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "USER_ROLE_CHANGE", {
      targetEntity: `USER#${userId}`,
      previousValue: previousRole,
      newValue: newRole,
      reason,
    });

    return result.Attributes;
  }

  /**
   * Deactivate user account (admin operation)
   * @param {string} userId - User ID to deactivate
   * @param {string} adminId - ID of admin performing the action
   * @param {string} reason - Reason for deactivation
   * @returns {Promise<Object>} Updated user object
   */
  static async deactivateUser(userId, adminId, reason = null) {
    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE",
        },
        UpdateExpression:
          "SET accountStatus = :status, suspendedBy = :adminId, suspendedAt = :now, suspensionReason = :reason",
        ExpressionAttributeValues: {
          ":status": "suspended",
          ":adminId": adminId,
          ":now": new Date().toISOString(),
          ":reason": reason,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "USER_DEACTIVATION", {
      targetEntity: `USER#${userId}`,
      previousValue: "active",
      newValue: "suspended",
      reason,
    });

    return result.Attributes;
  }

  /**
   * Reactivate user account (admin operation)
   * @param {string} userId - User ID to reactivate
   * @param {string} adminId - ID of admin performing the action
   * @param {string} reason - Reason for reactivation
   * @returns {Promise<Object>} Updated user object
   */
  static async reactivateUser(userId, adminId, reason = null) {
    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE",
        },
        UpdateExpression:
          "SET accountStatus = :status, reactivatedBy = :adminId, reactivatedAt = :now REMOVE suspendedBy, suspendedAt, suspensionReason",
        ExpressionAttributeValues: {
          ":status": "active",
          ":adminId": adminId,
          ":now": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "USER_REACTIVATION", {
      targetEntity: `USER#${userId}`,
      previousValue: "suspended",
      newValue: "active",
      reason,
    });

    return result.Attributes;
  }

  /**
   * Get all courses with pagination and filtering (admin operation)
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of items to return
   * @param {string} options.lastEvaluatedKey - Pagination key
   * @param {string} options.status - Filter by course status
   * @param {string} options.instructorId - Filter by instructor
   * @param {string} options.categoryId - Filter by category
   * @returns {Promise<Object>} Courses and pagination info
   */
  static async getAllCourses({
    limit = 50,
    lastEvaluatedKey,
    status,
    instructorId,
    categoryId,
  } = {}) {
    let params = {
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "Course",
      },
      Limit: limit,
    };

    // Add status filter if specified
    if (status) {
      params.FilterExpression += " AND #status = :status";
      params.ExpressionAttributeNames = { "#status": "status" };
      params.ExpressionAttributeValues[":status"] = status;
    }

    // Add instructor filter if specified
    if (instructorId) {
      params.FilterExpression += " AND instructorId = :instructorId";
      params.ExpressionAttributeValues[":instructorId"] = instructorId;
    }

    // Add category filter if specified
    if (categoryId) {
      params.FilterExpression += " AND categoryId = :categoryId";
      params.ExpressionAttributeValues[":categoryId"] = categoryId;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const result = await dynamoDb.send(new ScanCommand(params));

    return {
      courses: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
      count: result.Count,
    };
  }

  /**
   * Approve course (admin operation)
   * @param {string} courseId - Course ID to approve
   * @param {string} adminId - ID of admin performing the action
   * @param {string} reason - Reason for approval
   * @returns {Promise<Object>} Updated course object
   */
  static async approveCourse(courseId, adminId, reason = null) {
    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `COURSE#${courseId}`,
          SK: "METADATA",
        },
        UpdateExpression:
          "SET #status = :status, approvedBy = :adminId, approvedAt = :now",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "approved",
          ":adminId": adminId,
          ":now": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "COURSE_APPROVAL", {
      targetEntity: `COURSE#${courseId}`,
      previousValue: "pending",
      newValue: "approved",
      reason,
    });

    return result.Attributes;
  }

  /**
   * Moderate content (admin operation)
   * @param {string} contentId - Content ID to moderate
   * @param {string} contentType - Type of content (course, lecture, comment)
   * @param {string} action - Moderation action (approve, reject, flag)
   * @param {string} adminId - ID of admin performing the action
   * @param {string} reason - Reason for moderation action
   * @returns {Promise<Object>} Updated content object
   */
  static async moderateContent(
    contentId,
    contentType,
    action,
    adminId,
    reason = null
  ) {
    let pk, sk;

    switch (contentType) {
      case "course":
        pk = `COURSE#${contentId}`;
        sk = "METADATA";
        break;
      case "lecture":
        // Assuming lecture ID format includes course ID
        const [courseId, lectureId] = contentId.split("#");
        pk = `COURSE#${courseId}`;
        sk = `LECTURE#${lectureId}`;
        break;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
        UpdateExpression:
          "SET moderationStatus = :action, moderatedBy = :adminId, moderatedAt = :now, moderationReason = :reason",
        ExpressionAttributeValues: {
          ":action": action,
          ":adminId": adminId,
          ":now": new Date().toISOString(),
          ":reason": reason,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "CONTENT_MODERATION", {
      targetEntity: `${contentType.toUpperCase()}#${contentId}`,
      previousValue: null,
      newValue: action,
      reason,
      contentType,
    });

    return result.Attributes;
  }

  /**
   * Moderate content (admin operation)
   * @param {string} contentId - Content ID to moderate
   * @param {string} contentType - Type of content (course, lecture, comment)
   * @param {string} action - Moderation action (approve, reject, flag)
   * @param {string} adminId - ID of admin performing the action
   * @param {string} reason - Reason for moderation action
   * @returns {Promise<Object>} Updated content object
   */
  static async moderateContent(
    contentId,
    contentType,
    action,
    adminId,
    reason = null
  ) {
    let pk, sk;

    switch (contentType) {
      case "course":
        pk = `COURSE#${contentId}`;
        sk = "METADATA";
        break;
      case "lecture":
        // Assuming lecture ID format includes course ID
        const [courseId, lectureId] = contentId.split("#");
        pk = `COURSE#${courseId}`;
        sk = `LECTURE#${lectureId}`;
        break;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
        UpdateExpression:
          "SET moderationStatus = :action, moderatedBy = :adminId, moderatedAt = :now, moderationReason = :reason",
        ExpressionAttributeValues: {
          ":action": action,
          ":adminId": adminId,
          ":now": new Date().toISOString(),
          ":reason": reason,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  }

  /**
   * Get platform metrics for dashboard
   * @param {string} dateRange - Date range for metrics (optional)
   * @returns {Promise<Object>} Platform metrics
   */
  static async getPlatformMetrics(dateRange = null) {
    // Get total users by role
    const usersByRole = {};
    for (const role of Object.values(USER_ROLES)) {
      const result = await dynamoDb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: "entityType = :entityType AND #role = :role",
          ExpressionAttributeNames: { "#role": "role" },
          ExpressionAttributeValues: {
            ":entityType": "User",
            ":role": role,
          },
          Select: "COUNT",
        })
      );
      usersByRole[role] = result.Count;
    }

    // Get total courses
    const coursesResult = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "Course",
        },
        Select: "COUNT",
      })
    );

    // Get total enrollments
    const enrollmentsResult = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "Enrollment",
        },
        Select: "COUNT",
      })
    );

    return {
      totalUsers: Object.values(usersByRole).reduce(
        (sum, count) => sum + count,
        0
      ),
      usersByRole,
      totalCourses: coursesResult.Count,
      totalEnrollments: enrollmentsResult.Count,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get revenue analytics for admin dashboard
   * @param {Object} options - Analytics options
   * @param {string} options.startDate - Start date for analytics (ISO string)
   * @param {string} options.endDate - End date for analytics (ISO string)
   * @param {string} options.groupBy - Group by period (day, week, month)
   * @returns {Promise<Object>} Revenue analytics data
   */
  static async getRevenueAnalytics({
    startDate,
    endDate,
    groupBy = "day",
  } = {}) {
    // Get all enrollments with payment information
    const params = {
      TableName: TABLE_NAME,
      FilterExpression:
        "entityType = :entityType AND attribute_exists(paymentAmount)",
      ExpressionAttributeValues: {
        ":entityType": "Enrollment",
      },
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      params.FilterExpression +=
        " AND createdAt BETWEEN :startDate AND :endDate";
      params.ExpressionAttributeValues[":startDate"] = startDate;
      params.ExpressionAttributeValues[":endDate"] = endDate;
    }

    const result = await dynamoDb.send(new ScanCommand(params));
    const enrollments = result.Items || [];

    // Calculate total revenue
    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.paymentAmount || 0);
    }, 0);

    // Group revenue by time period
    const revenueByPeriod = {};
    enrollments.forEach((enrollment) => {
      const date = new Date(enrollment.createdAt);
      let periodKey;

      switch (groupBy) {
        case "day":
          periodKey = date.toISOString().split("T")[0];
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split("T")[0];
          break;
        case "month":
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        default:
          periodKey = date.toISOString().split("T")[0];
      }

      if (!revenueByPeriod[periodKey]) {
        revenueByPeriod[periodKey] = 0;
      }
      revenueByPeriod[periodKey] += enrollment.paymentAmount || 0;
    });

    // Calculate revenue by course category
    const revenueByCourse = {};
    enrollments.forEach((enrollment) => {
      const courseId = enrollment.courseId;
      if (!revenueByCourse[courseId]) {
        revenueByCourse[courseId] = {
          courseId,
          courseName: enrollment.courseName || "Unknown Course",
          revenue: 0,
          enrollmentCount: 0,
        };
      }
      revenueByCourse[courseId].revenue += enrollment.paymentAmount || 0;
      revenueByCourse[courseId].enrollmentCount += 1;
    });

    return {
      totalRevenue,
      totalEnrollments: enrollments.length,
      averageRevenuePerEnrollment:
        enrollments.length > 0 ? totalRevenue / enrollments.length : 0,
      revenueByPeriod,
      revenueByCourse: Object.values(revenueByCourse),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get user growth statistics for admin dashboard
   * @param {Object} options - Analytics options
   * @param {string} options.startDate - Start date for analytics (ISO string)
   * @param {string} options.endDate - End date for analytics (ISO string)
   * @param {string} options.groupBy - Group by period (day, week, month)
   * @returns {Promise<Object>} User growth statistics
   */
  static async getUserGrowthStats({
    startDate,
    endDate,
    groupBy = "day",
  } = {}) {
    // Get all users
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "User",
      },
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      params.FilterExpression +=
        " AND createdAt BETWEEN :startDate AND :endDate";
      params.ExpressionAttributeValues[":startDate"] = startDate;
      params.ExpressionAttributeValues[":endDate"] = endDate;
    }

    const result = await dynamoDb.send(new ScanCommand(params));
    const users = result.Items || [];

    // Group users by registration period
    const usersByPeriod = {};
    const usersByRole = {};

    users.forEach((user) => {
      const date = new Date(user.createdAt);
      let periodKey;

      switch (groupBy) {
        case "day":
          periodKey = date.toISOString().split("T")[0];
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split("T")[0];
          break;
        case "month":
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        default:
          periodKey = date.toISOString().split("T")[0];
      }

      // Count by period
      if (!usersByPeriod[periodKey]) {
        usersByPeriod[periodKey] = 0;
      }
      usersByPeriod[periodKey] += 1;

      // Count by role
      const role = user.role || "unknown";
      if (!usersByRole[role]) {
        usersByRole[role] = 0;
      }
      usersByRole[role] += 1;
    });

    // Calculate growth rate
    const periods = Object.keys(usersByPeriod).sort();
    const growthRates = {};
    for (let i = 1; i < periods.length; i++) {
      const currentPeriod = periods[i];
      const previousPeriod = periods[i - 1];
      const currentCount = usersByPeriod[currentPeriod];
      const previousCount = usersByPeriod[previousPeriod];

      if (previousCount > 0) {
        growthRates[currentPeriod] =
          ((currentCount - previousCount) / previousCount) * 100;
      }
    }

    return {
      totalUsers: users.length,
      usersByPeriod,
      usersByRole,
      growthRates,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Log admin action for audit trail
   * @param {string} adminId - ID of admin performing the action
   * @param {string} action - Action performed (e.g., USER_ROLE_CHANGE, COURSE_APPROVAL)
   * @param {Object} details - Action details
   * @param {string} details.targetEntity - Entity affected by the action
   * @param {Object} details.previousValue - Previous value (if applicable)
   * @param {Object} details.newValue - New value (if applicable)
   * @param {string} details.reason - Reason for the action
   * @param {string} ipAddress - IP address of the admin
   * @param {string} userAgent - User agent string
   * @returns {Promise<Object>} Created audit log entry
   */
  static async logAdminAction(
    adminId,
    action,
    details,
    ipAddress = null,
    userAgent = null
  ) {
    const actionId = uuidv4();
    const timestamp = new Date().toISOString();

    const auditItem = {
      PK: `ADMIN#${adminId}`,
      SK: `ACTION#${timestamp}#${actionId}`,
      GSI8PK: `AUDIT#${adminId}`,
      GSI8SK: `ACTION#${timestamp}#${actionId}`,
      entityType: "AdminAction",
      actionId,
      adminId,
      action,
      targetEntity: details.targetEntity,
      details: {
        previousValue: details.previousValue || null,
        newValue: details.newValue || null,
        reason: details.reason || null,
        ...details,
      },
      ipAddress,
      userAgent,
      timestamp,
      createdAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: auditItem,
      })
    );

    return auditItem;
  }

  /**
   * Get audit trail with filtering and pagination
   * @param {Object} options - Query options
   * @param {string} options.adminId - Filter by specific admin (optional)
   * @param {string} options.action - Filter by action type (optional)
   * @param {string} options.startDate - Start date for filtering (optional)
   * @param {string} options.endDate - End date for filtering (optional)
   * @param {number} options.limit - Number of items to return
   * @param {string} options.lastEvaluatedKey - Pagination key
   * @returns {Promise<Object>} Audit trail entries and pagination info
   */
  static async getAuditTrail({
    adminId,
    action,
    startDate,
    endDate,
    limit = 50,
    lastEvaluatedKey,
  } = {}) {
    let params;

    if (adminId) {
      // Query specific admin's actions using GSI8
      params = {
        TableName: TABLE_NAME,
        IndexName: "GSI8",
        KeyConditionExpression: "GSI8PK = :adminPK",
        ExpressionAttributeValues: {
          ":adminPK": `AUDIT#${adminId}`,
        },
        ScanIndexForward: false, // newest first
        Limit: limit,
      };

      // Add date range filter if provided
      if (startDate && endDate) {
        params.KeyConditionExpression +=
          " AND GSI8SK BETWEEN :startKey AND :endKey";
        params.ExpressionAttributeValues[":startKey"] = `ACTION#${startDate}`;
        params.ExpressionAttributeValues[":endKey"] =
          `ACTION#${endDate}#ZZZZZZ`;
      }
    } else {
      // Scan all audit logs
      params = {
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "AdminAction",
        },
        Limit: limit,
      };

      // Add date range filter if provided
      if (startDate && endDate) {
        params.FilterExpression +=
          " AND #timestamp BETWEEN :startDate AND :endDate";
        params.ExpressionAttributeNames = { "#timestamp": "timestamp" };
        params.ExpressionAttributeValues[":startDate"] = startDate;
        params.ExpressionAttributeValues[":endDate"] = endDate;
      }
    }

    // Add action filter if specified
    if (action) {
      if (params.FilterExpression) {
        params.FilterExpression += " AND #action = :action";
      } else {
        params.FilterExpression = "#action = :action";
      }
      if (!params.ExpressionAttributeNames) {
        params.ExpressionAttributeNames = {};
      }
      params.ExpressionAttributeNames["#action"] = "action";
      params.ExpressionAttributeValues[":action"] = action;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const command = adminId
      ? new QueryCommand(params)
      : new ScanCommand(params);
    const result = await dynamoDb.send(command);

    return {
      auditLogs: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
      count: result.Count,
    };
  }

  /**
   * Get audit statistics for admin dashboard
   * @param {Object} options - Statistics options
   * @param {string} options.startDate - Start date for statistics (optional)
   * @param {string} options.endDate - End date for statistics (optional)
   * @returns {Promise<Object>} Audit statistics
   */
  static async getAuditStatistics({ startDate, endDate } = {}) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "AdminAction",
      },
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      params.FilterExpression +=
        " AND #timestamp BETWEEN :startDate AND :endDate";
      params.ExpressionAttributeNames = { "#timestamp": "timestamp" };
      params.ExpressionAttributeValues[":startDate"] = startDate;
      params.ExpressionAttributeValues[":endDate"] = endDate;
    }

    const result = await dynamoDb.send(new ScanCommand(params));
    const auditLogs = result.Items || [];

    // Calculate statistics
    const actionsByType = {};
    const actionsByAdmin = {};
    const actionsByDate = {};

    auditLogs.forEach((log) => {
      // Count by action type
      const action = log.action;
      actionsByType[action] = (actionsByType[action] || 0) + 1;

      // Count by admin
      const adminId = log.adminId;
      actionsByAdmin[adminId] = (actionsByAdmin[adminId] || 0) + 1;

      // Count by date
      const date = log.timestamp.split("T")[0];
      actionsByDate[date] = (actionsByDate[date] || 0) + 1;
    });

    return {
      totalActions: auditLogs.length,
      actionsByType,
      actionsByAdmin,
      actionsByDate,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get system settings
   * @returns {Promise<Object>} System settings
   */
  static async getSystemSettings() {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "SYSTEM",
          SK: "SETTINGS",
        },
      })
    );

    // Return default settings if none exist
    if (!result.Item) {
      return {
        platformSettings: {
          platformName: "UpSkillPro",
          maintenanceMode: false,
          allowUserRegistration: true,
          requireCourseApproval: true,
          maxFileUploadSize: 100, // MB
          supportEmail: "support@upskillpro.com",
          defaultLanguage: "en",
        },
        featureFlags: {
          enableCourseReviews: true,
          enableCertificates: true,
          enableDiscussionForums: true,
          enableLiveStreaming: false,
          enableAIRecommendations: false,
        },
        paymentSettings: {
          provider: "stripe",
          currency: "USD",
          commissionRate: 15, // percentage
          enableRefunds: true,
          refundPeriodDays: 30,
        },
        integrationSettings: {
          emailProvider: "sendgrid",
          storageProvider: "aws-s3",
          analyticsProvider: "google-analytics",
          enableWebhooks: true,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    return result.Item;
  }

  /**
   * Update platform settings
   * @param {Object} settings - Platform settings to update
   * @param {string} adminId - ID of admin performing the update
   * @returns {Promise<Object>} Updated settings
   */
  static async updatePlatformSettings(settings, adminId) {
    const timestamp = new Date().toISOString();

    // Get current settings for audit trail
    const currentSettings = await this.getSystemSettings();

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "SYSTEM",
          SK: "SETTINGS",
        },
        UpdateExpression:
          "SET platformSettings = :settings, updatedAt = :now, updatedBy = :adminId",
        ExpressionAttributeValues: {
          ":settings": settings,
          ":now": timestamp,
          ":adminId": adminId,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "PLATFORM_SETTINGS_UPDATE", {
      targetEntity: "SYSTEM#SETTINGS",
      previousValue: currentSettings.platformSettings,
      newValue: settings,
    });

    return result.Attributes;
  }

  /**
   * Update feature flags
   * @param {Object} featureFlags - Feature flags to update
   * @param {string} adminId - ID of admin performing the update
   * @returns {Promise<Object>} Updated settings
   */
  static async updateFeatureFlags(featureFlags, adminId) {
    const timestamp = new Date().toISOString();

    // Get current settings for audit trail
    const currentSettings = await this.getSystemSettings();

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "SYSTEM",
          SK: "SETTINGS",
        },
        UpdateExpression:
          "SET featureFlags = :flags, updatedAt = :now, updatedBy = :adminId",
        ExpressionAttributeValues: {
          ":flags": featureFlags,
          ":now": timestamp,
          ":adminId": adminId,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "FEATURE_FLAGS_UPDATE", {
      targetEntity: "SYSTEM#SETTINGS",
      previousValue: currentSettings.featureFlags,
      newValue: featureFlags,
    });

    return result.Attributes;
  }

  /**
   * Update payment settings
   * @param {Object} paymentSettings - Payment settings to update
   * @param {string} adminId - ID of admin performing the update
   * @returns {Promise<Object>} Updated settings
   */
  static async updatePaymentSettings(paymentSettings, adminId) {
    const timestamp = new Date().toISOString();

    // Get current settings for audit trail
    const currentSettings = await this.getSystemSettings();

    // Encrypt sensitive payment data before storing (in real implementation)
    const sanitizedSettings = { ...paymentSettings };
    if (sanitizedSettings.apiKey) {
      sanitizedSettings.apiKey = "***ENCRYPTED***";
    }
    if (sanitizedSettings.secretKey) {
      sanitizedSettings.secretKey = "***ENCRYPTED***";
    }

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "SYSTEM",
          SK: "SETTINGS",
        },
        UpdateExpression:
          "SET paymentSettings = :settings, updatedAt = :now, updatedBy = :adminId",
        ExpressionAttributeValues: {
          ":settings": sanitizedSettings,
          ":now": timestamp,
          ":adminId": adminId,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action (without sensitive data)
    await this.logAdminAction(adminId, "PAYMENT_SETTINGS_UPDATE", {
      targetEntity: "SYSTEM#SETTINGS",
      previousValue: { provider: currentSettings.paymentSettings?.provider },
      newValue: { provider: sanitizedSettings.provider },
    });

    return result.Attributes;
  }

  /**
   * Update integration settings
   * @param {Object} integrationSettings - Integration settings to update
   * @param {string} adminId - ID of admin performing the update
   * @returns {Promise<Object>} Updated settings
   */
  static async updateIntegrationSettings(integrationSettings, adminId) {
    const timestamp = new Date().toISOString();

    // Get current settings for audit trail
    const currentSettings = await this.getSystemSettings();

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "SYSTEM",
          SK: "SETTINGS",
        },
        UpdateExpression:
          "SET integrationSettings = :settings, updatedAt = :now, updatedBy = :adminId",
        ExpressionAttributeValues: {
          ":settings": integrationSettings,
          ":now": timestamp,
          ":adminId": adminId,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "INTEGRATION_SETTINGS_UPDATE", {
      targetEntity: "SYSTEM#SETTINGS",
      previousValue: currentSettings.integrationSettings,
      newValue: integrationSettings,
    });

    return result.Attributes;
  }

  /**
   * Get security policies
   * @returns {Promise<Object>} Security policies
   */
  static async getSecurityPolicies() {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "SYSTEM",
          SK: "SECURITY_POLICIES",
        },
      })
    );

    // Return default policies if none exist
    if (!result.Item) {
      return {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90, // days
          preventReuse: 5, // last N passwords
        },
        sessionPolicy: {
          maxDuration: 24, // hours
          idleTimeout: 2, // hours
          requireMFA: false,
          allowConcurrentSessions: true,
          maxConcurrentSessions: 3,
        },
        accessControl: {
          enableIPWhitelist: false,
          allowedIPs: [],
          enableRateLimit: true,
          maxRequestsPerMinute: 100,
          enableBruteForceProtection: true,
          maxFailedAttempts: 5,
          lockoutDuration: 30, // minutes
        },
        updatedAt: new Date().toISOString(),
      };
    }

    return result.Item;
  }

  /**
   * Update security policies
   * @param {Object} policies - Security policies to update
   * @param {string} adminId - ID of admin performing the update
   * @returns {Promise<Object>} Updated policies
   */
  static async updateSecurityPolicies(policies, adminId) {
    const timestamp = new Date().toISOString();

    // Get current policies for audit trail
    const currentPolicies = await this.getSecurityPolicies();

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "SYSTEM",
          SK: "SECURITY_POLICIES",
        },
        UpdateExpression:
          "SET passwordPolicy = :passwordPolicy, sessionPolicy = :sessionPolicy, accessControl = :accessControl, updatedAt = :now, updatedBy = :adminId",
        ExpressionAttributeValues: {
          ":passwordPolicy":
            policies.passwordPolicy || currentPolicies.passwordPolicy,
          ":sessionPolicy":
            policies.sessionPolicy || currentPolicies.sessionPolicy,
          ":accessControl":
            policies.accessControl || currentPolicies.accessControl,
          ":now": timestamp,
          ":adminId": adminId,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "SECURITY_POLICIES_UPDATE", {
      targetEntity: "SYSTEM#SECURITY_POLICIES",
      previousValue: currentPolicies,
      newValue: policies,
    });

    return result.Attributes;
  } /*
   *
   * Get login attempts and failed authentication data
   * Requirements: 6.1, 6.2
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date for filtering (optional)
   * @param {string} options.endDate - End date for filtering (optional)
   * @param {number} options.limit - Number of items to return
   * @param {string} options.lastEvaluatedKey - Pagination key
   * @returns {Promise<Object>} Login attempts and security events
   */
  static async getSecurityEvents({
    startDate,
    endDate,
    limit = 100,
    lastEvaluatedKey,
  } = {}) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "SecurityEvent",
      },
      Limit: limit,
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      params.FilterExpression +=
        " AND #timestamp BETWEEN :startDate AND :endDate";
      params.ExpressionAttributeNames = { "#timestamp": "timestamp" };
      params.ExpressionAttributeValues[":startDate"] = startDate;
      params.ExpressionAttributeValues[":endDate"] = endDate;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const result = await dynamoDb.send(new ScanCommand(params));

    // Categorize events
    const events = result.Items || [];
    const loginAttempts = events.filter((e) => e.eventType === "LOGIN_ATTEMPT");
    const failedLogins = events.filter((e) => e.eventType === "FAILED_LOGIN");
    const suspiciousActivity = events.filter(
      (e) => e.eventType === "SUSPICIOUS_ACTIVITY"
    );

    return {
      securityEvents: events,
      loginAttempts,
      failedLogins,
      suspiciousActivity,
      lastEvaluatedKey: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
      count: result.Count,
    };
  }

  /**
   * Log security event
   * Requirements: 6.1, 6.2, 6.3
   * @param {string} eventType - Type of security event
   * @param {string} userId - User ID involved (optional)
   * @param {Object} details - Event details
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent string
   * @returns {Promise<Object>} Created security event
   */
  static async logSecurityEvent(
    eventType,
    userId,
    details,
    ipAddress,
    userAgent
  ) {
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();

    const securityEvent = {
      PK: `SECURITY#${eventType}`,
      SK: `EVENT#${timestamp}#${eventId}`,
      entityType: "SecurityEvent",
      eventId,
      eventType,
      userId: userId || null,
      details,
      ipAddress,
      userAgent,
      timestamp,
      createdAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: securityEvent,
      })
    );

    return securityEvent;
  }

  /**
   * Get user activity logs with detailed tracking
   * Requirements: 6.3, 6.4
   * @param {string} userId - User ID to get activity for
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date for filtering (optional)
   * @param {string} options.endDate - End date for filtering (optional)
   * @param {number} options.limit - Number of items to return
   * @returns {Promise<Object>} User activity data
   */
  static async getUserActivityLogs(
    userId,
    { startDate, endDate, limit = 50 } = {}
  ) {
    // Get security events for this user
    const securityParams = {
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :entityType AND userId = :userId",
      ExpressionAttributeValues: {
        ":entityType": "SecurityEvent",
        ":userId": userId,
      },
      Limit: limit,
    };

    if (startDate && endDate) {
      securityParams.FilterExpression +=
        " AND #timestamp BETWEEN :startDate AND :endDate";
      securityParams.ExpressionAttributeNames = { "#timestamp": "timestamp" };
      securityParams.ExpressionAttributeValues[":startDate"] = startDate;
      securityParams.ExpressionAttributeValues[":endDate"] = endDate;
    }

    const securityResult = await dynamoDb.send(new ScanCommand(securityParams));

    // Get audit logs where this user was the target
    const auditResult = await this.getAuditTrail({
      startDate,
      endDate,
      limit,
    });

    const userAuditLogs = auditResult.auditLogs.filter(
      (log) => log.details?.targetEntity === `USER#${userId}`
    );

    return {
      securityEvents: securityResult.Items || [],
      auditLogs: userAuditLogs,
      totalEvents: (securityResult.Items || []).length + userAuditLogs.length,
    };
  }

  /**
   * Detect and flag suspicious activity
   * Requirements: 6.2, 6.3
   * @param {Object} options - Detection options
   * @param {number} options.hoursBack - Hours to look back for analysis
   * @returns {Promise<Object>} Suspicious activity alerts
   */
  static async detectSuspiciousActivity({ hoursBack = 24 } = {}) {
    const startDate = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000
    ).toISOString();
    const endDate = new Date().toISOString();

    // Get recent security events
    const securityEvents = await this.getSecurityEvents({
      startDate,
      endDate,
      limit: 1000,
    });

    const alerts = [];

    // Analyze failed login attempts
    const failedLoginsByIP = {};
    const failedLoginsByUser = {};

    securityEvents.failedLogins.forEach((event) => {
      const ip = event.ipAddress;
      const userId = event.userId;

      if (ip) {
        failedLoginsByIP[ip] = (failedLoginsByIP[ip] || 0) + 1;
      }
      if (userId) {
        failedLoginsByUser[userId] = (failedLoginsByUser[userId] || 0) + 1;
      }
    });

    // Flag IPs with excessive failed attempts
    Object.entries(failedLoginsByIP).forEach(([ip, count]) => {
      if (count >= 10) {
        alerts.push({
          type: "EXCESSIVE_FAILED_LOGINS_IP",
          severity: "HIGH",
          description: `IP ${ip} has ${count} failed login attempts in the last ${hoursBack} hours`,
          details: { ipAddress: ip, failedAttempts: count },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Flag users with excessive failed attempts
    Object.entries(failedLoginsByUser).forEach(([userId, count]) => {
      if (count >= 5) {
        alerts.push({
          type: "EXCESSIVE_FAILED_LOGINS_USER",
          severity: "MEDIUM",
          description: `User ${userId} has ${count} failed login attempts in the last ${hoursBack} hours`,
          details: { userId, failedAttempts: count },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Analyze login patterns for unusual activity
    const loginsByUser = {};
    securityEvents.loginAttempts.forEach((event) => {
      if (event.userId && event.details?.success) {
        if (!loginsByUser[event.userId]) {
          loginsByUser[event.userId] = [];
        }
        loginsByUser[event.userId].push({
          timestamp: event.timestamp,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        });
      }
    });

    // Flag users with logins from multiple IPs
    Object.entries(loginsByUser).forEach(([userId, logins]) => {
      const uniqueIPs = new Set(logins.map((l) => l.ipAddress));
      if (uniqueIPs.size >= 3) {
        alerts.push({
          type: "MULTIPLE_IP_LOGINS",
          severity: "MEDIUM",
          description: `User ${userId} logged in from ${uniqueIPs.size} different IP addresses`,
          details: { userId, ipAddresses: Array.from(uniqueIPs) },
          timestamp: new Date().toISOString(),
        });
      }
    });

    return {
      alerts,
      summary: {
        totalAlerts: alerts.length,
        highSeverity: alerts.filter((a) => a.severity === "HIGH").length,
        mediumSeverity: alerts.filter((a) => a.severity === "MEDIUM").length,
        lowSeverity: alerts.filter((a) => a.severity === "LOW").length,
      },
      analysisPeriod: { startDate, endDate },
    };
  }

  /**
   * Get security monitoring dashboard data
   * Requirements: 6.1, 6.2, 6.3, 6.4
   * @param {Object} options - Dashboard options
   * @param {number} options.hoursBack - Hours to look back for metrics
   * @returns {Promise<Object>} Security dashboard data
   */
  static async getSecurityDashboard({ hoursBack = 24 } = {}) {
    const startDate = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000
    ).toISOString();
    const endDate = new Date().toISOString();

    // Get security events
    const securityEvents = await this.getSecurityEvents({
      startDate,
      endDate,
      limit: 1000,
    });

    // Get suspicious activity alerts
    const suspiciousActivity = await this.detectSuspiciousActivity({
      hoursBack,
    });

    // Calculate metrics
    const totalLoginAttempts = securityEvents.loginAttempts.length;
    const failedLoginAttempts = securityEvents.failedLogins.length;
    const successfulLogins = securityEvents.loginAttempts.filter(
      (e) => e.details?.success
    ).length;

    const loginSuccessRate =
      totalLoginAttempts > 0
        ? ((successfulLogins / totalLoginAttempts) * 100).toFixed(1)
        : 0;

    // Group events by hour for trending
    const eventsByHour = {};
    securityEvents.securityEvents.forEach((event) => {
      const hour = new Date(event.timestamp).toISOString().substring(0, 13);
      if (!eventsByHour[hour]) {
        eventsByHour[hour] = { total: 0, failed: 0, suspicious: 0 };
      }
      eventsByHour[hour].total++;
      if (event.eventType === "FAILED_LOGIN") {
        eventsByHour[hour].failed++;
      }
      if (event.eventType === "SUSPICIOUS_ACTIVITY") {
        eventsByHour[hour].suspicious++;
      }
    });

    return {
      metrics: {
        totalLoginAttempts,
        successfulLogins,
        failedLoginAttempts,
        loginSuccessRate,
        suspiciousActivityCount: securityEvents.suspiciousActivity.length,
        activeAlerts: suspiciousActivity.alerts.length,
      },
      alerts: suspiciousActivity.alerts,
      trends: {
        eventsByHour,
        analysisPeriod: { startDate, endDate },
      },
      recentEvents: securityEvents.securityEvents.slice(0, 20),
    };
  }

  /**
   * Create a support ticket
   * Requirements: 8.1, 8.2
   * @param {Object} ticketData - Ticket information
   * @returns {Promise<Object>} Created ticket
   */
  static async createSupportTicket(ticketData) {
    const ticketId = uuidv4();
    const timestamp = new Date().toISOString();

    const ticket = {
      PK: `TICKET#${ticketId}`,
      SK: `METADATA`,
      GSI1PK: `TICKETS#${ticketData.status || "open"}`,
      GSI1SK: `PRIORITY#${ticketData.priority || "medium"}#${timestamp}`,
      GSI2PK: `USER#${ticketData.userId}`,
      GSI2SK: `TICKET#${timestamp}`,
      entityType: "SupportTicket",
      ticketId,
      userId: ticketData.userId,
      userEmail: ticketData.userEmail,
      userName: ticketData.userName,
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category || "general",
      priority: ticketData.priority || "medium",
      status: ticketData.status || "open",
      assignedTo: ticketData.assignedTo || null,
      tags: ticketData.tags || [],
      createdAt: timestamp,
      updatedAt: timestamp,
      resolvedAt: null,
      resolvedBy: null,
      resolutionNotes: null,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: ticket,
      })
    );

    return ticket;
  }

  /**
   * Get all support tickets with filtering
   * Requirements: 8.1, 8.2
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tickets and pagination info
   */
  static async getAllSupportTickets({
    status,
    priority,
    category,
    assignedTo,
    userId,
    limit = 50,
    lastEvaluatedKey,
  } = {}) {
    let params;

    if (status) {
      // Query by status using GSI1
      params = {
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :statusPK",
        ExpressionAttributeValues: {
          ":statusPK": `TICKETS#${status}`,
        },
        ScanIndexForward: false,
        Limit: limit,
      };

      if (priority) {
        params.KeyConditionExpression +=
          " AND begins_with(GSI1SK, :priorityPrefix)";
        params.ExpressionAttributeValues[":priorityPrefix"] =
          `PRIORITY#${priority}`;
      }
    } else if (userId) {
      // Query by user using GSI2
      params = {
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :userPK",
        ExpressionAttributeValues: {
          ":userPK": `USER#${userId}`,
        },
        ScanIndexForward: false,
        Limit: limit,
      };
    } else {
      // Scan all tickets
      params = {
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "SupportTicket",
        },
        Limit: limit,
      };
    }

    // Add additional filters
    if (category && !status) {
      params.FilterExpression = params.FilterExpression
        ? `${params.FilterExpression} AND category = :category`
        : "category = :category";
      params.ExpressionAttributeValues[":category"] = category;
    }

    if (assignedTo) {
      params.FilterExpression = params.FilterExpression
        ? `${params.FilterExpression} AND assignedTo = :assignedTo`
        : "assignedTo = :assignedTo";
      params.ExpressionAttributeValues[":assignedTo"] = assignedTo;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const command =
      status || userId ? new QueryCommand(params) : new ScanCommand(params);
    const result = await dynamoDb.send(command);

    return {
      tickets: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
      count: result.Count,
    };
  }

  /**
   * Get support ticket by ID
   * Requirements: 8.2
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Ticket details
   */
  static async getSupportTicketById(ticketId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `TICKET#${ticketId}`,
          SK: `METADATA`,
        },
      })
    );

    return result.Item;
  }

  /**
   * Update support ticket
   * Requirements: 8.2, 8.3
   * @param {string} ticketId - Ticket ID
   * @param {Object} updates - Fields to update
   * @param {string} adminId - Admin performing the update
   * @returns {Promise<Object>} Updated ticket
   */
  static async updateSupportTicket(ticketId, updates, adminId) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ":updatedAt": new Date().toISOString(),
    };

    // Build dynamic update expression
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== "ticketId") {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });

    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    // Update GSI keys if status or priority changed
    if (updates.status) {
      updateExpressions.push("#GSI1PK = :GSI1PK");
      expressionAttributeNames["#GSI1PK"] = "GSI1PK";
      expressionAttributeValues[":GSI1PK"] = `TICKETS#${updates.status}`;
    }

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `TICKET#${ticketId}`,
          SK: `METADATA`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "TICKET_UPDATED", {
      targetEntity: `TICKET#${ticketId}`,
      updates,
    });

    return result.Attributes;
  }

  /**
   * Add message to support ticket
   * Requirements: 8.2, 8.5
   * @param {string} ticketId - Ticket ID
   * @param {Object} messageData - Message information
   * @returns {Promise<Object>} Created message
   */
  static async addTicketMessage(ticketId, messageData) {
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    const message = {
      PK: `TICKET#${ticketId}`,
      SK: `MESSAGE#${timestamp}#${messageId}`,
      entityType: "TicketMessage",
      messageId,
      ticketId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderRole: messageData.senderRole,
      message: messageData.message,
      attachments: messageData.attachments || [],
      isInternal: messageData.isInternal || false,
      createdAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: message,
      })
    );

    // Update ticket's updatedAt timestamp
    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `TICKET#${ticketId}`,
          SK: `METADATA`,
        },
        UpdateExpression: "SET updatedAt = :now",
        ExpressionAttributeValues: {
          ":now": timestamp,
        },
      })
    );

    return message;
  }

  /**
   * Get ticket messages (communication history)
   * Requirements: 8.2
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Array>} Ticket messages
   */
  static async getTicketMessages(ticketId) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression:
        "PK = :ticketPK AND begins_with(SK, :messagePrefix)",
      ExpressionAttributeValues: {
        ":ticketPK": `TICKET#${ticketId}`,
        ":messagePrefix": "MESSAGE#",
      },
      ScanIndexForward: true, // oldest first
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    return result.Items || [];
  }

  /**
   * Resolve support ticket
   * Requirements: 8.3, 8.5
   * @param {string} ticketId - Ticket ID
   * @param {string} adminId - Admin resolving the ticket
   * @param {string} resolutionNotes - Resolution notes
   * @returns {Promise<Object>} Updated ticket
   */
  static async resolveSupportTicket(ticketId, adminId, resolutionNotes) {
    const timestamp = new Date().toISOString();

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `TICKET#${ticketId}`,
          SK: `METADATA`,
        },
        UpdateExpression:
          "SET #status = :status, resolvedAt = :now, resolvedBy = :adminId, resolutionNotes = :notes, updatedAt = :now, GSI1PK = :GSI1PK",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "resolved",
          ":now": timestamp,
          ":adminId": adminId,
          ":notes": resolutionNotes,
          ":GSI1PK": "TICKETS#resolved",
        },
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "TICKET_RESOLVED", {
      targetEntity: `TICKET#${ticketId}`,
      resolutionNotes,
    });

    return result.Attributes;
  }

  /**
   * Get ticket statistics
   * Requirements: 8.1
   * @returns {Promise<Object>} Ticket statistics
   */
  static async getTicketStatistics() {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "SupportTicket",
      },
    };

    const result = await dynamoDb.send(new ScanCommand(params));
    const tickets = result.Items || [];

    const stats = {
      total: tickets.length,
      byStatus: {},
      byPriority: {},
      byCategory: {},
      avgResolutionTime: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    tickets.forEach((ticket) => {
      // Count by status
      stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;

      // Count by priority
      stats.byPriority[ticket.priority] =
        (stats.byPriority[ticket.priority] || 0) + 1;

      // Count by category
      stats.byCategory[ticket.category] =
        (stats.byCategory[ticket.category] || 0) + 1;

      // Calculate resolution time
      if (ticket.status === "resolved" && ticket.resolvedAt) {
        const created = new Date(ticket.createdAt);
        const resolved = new Date(ticket.resolvedAt);
        const resolutionTime = (resolved - created) / (1000 * 60 * 60); // hours
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    if (resolvedCount > 0) {
      stats.avgResolutionTime = (totalResolutionTime / resolvedCount).toFixed(
        2
      );
    }

    return stats;
  }

  /**
   * Create platform-wide announcement
   * Requirements: 8.4, 11.1, 11.2
   * @param {Object} announcementData - Announcement information
   * @returns {Promise<Object>} Created announcement
   */
  static async createAnnouncement(announcementData) {
    const announcementId = uuidv4();
    const timestamp = new Date().toISOString();

    const announcement = {
      PK: `ANNOUNCEMENT#${announcementId}`,
      SK: `METADATA`,
      GSI1PK: `ANNOUNCEMENTS#${announcementData.status || "draft"}`,
      GSI1SK: `SCHEDULED#${announcementData.scheduledFor || timestamp}`,
      entityType: "Announcement",
      announcementId,
      title: announcementData.title,
      content: announcementData.content,
      type: announcementData.type || "info", // info, warning, success, error
      targetAudience: announcementData.targetAudience || "all", // all, students, instructors, specific
      targetUserIds: announcementData.targetUserIds || [],
      targetRoles: announcementData.targetRoles || [],
      status: announcementData.status || "draft", // draft, scheduled, published, archived
      scheduledFor: announcementData.scheduledFor || null,
      publishedAt: announcementData.status === "published" ? timestamp : null,
      expiresAt: announcementData.expiresAt || null,
      channels: announcementData.channels || ["in_app"], // in_app, email, dashboard
      priority: announcementData.priority || "normal", // low, normal, high, urgent
      createdBy: announcementData.createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: announcement,
      })
    );

    return announcement;
  }

  /**
   * Get all announcements with filtering
   * Requirements: 11.1, 11.2
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Announcements and pagination info
   */
  static async getAllAnnouncements({
    status,
    limit = 50,
    lastEvaluatedKey,
  } = {}) {
    let params;

    if (status) {
      // Query by status using GSI1
      params = {
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :statusPK",
        ExpressionAttributeValues: {
          ":statusPK": `ANNOUNCEMENTS#${status}`,
        },
        ScanIndexForward: false,
        Limit: limit,
      };
    } else {
      // Scan all announcements
      params = {
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "Announcement",
        },
        Limit: limit,
      };
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const command = status ? new QueryCommand(params) : new ScanCommand(params);
    const result = await dynamoDb.send(command);

    return {
      announcements: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
      count: result.Count,
    };
  }

  /**
   * Get announcement by ID
   * Requirements: 11.1
   * @param {string} announcementId - Announcement ID
   * @returns {Promise<Object>} Announcement details
   */
  static async getAnnouncementById(announcementId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ANNOUNCEMENT#${announcementId}`,
          SK: `METADATA`,
        },
      })
    );

    return result.Item;
  }

  /**
   * Update announcement
   * Requirements: 11.1, 11.2
   * @param {string} announcementId - Announcement ID
   * @param {Object} updates - Fields to update
   * @param {string} adminId - Admin performing the update
   * @returns {Promise<Object>} Updated announcement
   */
  static async updateAnnouncement(announcementId, updates, adminId) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ":updatedAt": new Date().toISOString(),
    };

    // Build dynamic update expression
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== "announcementId") {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });

    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    // Update GSI keys if status changed
    if (updates.status) {
      updateExpressions.push("#GSI1PK = :GSI1PK");
      expressionAttributeNames["#GSI1PK"] = "GSI1PK";
      expressionAttributeValues[":GSI1PK"] = `ANNOUNCEMENTS#${updates.status}`;
    }

    // Set publishedAt if status is being changed to published
    if (updates.status === "published") {
      updateExpressions.push("#publishedAt = :publishedAt");
      expressionAttributeNames["#publishedAt"] = "publishedAt";
      expressionAttributeValues[":publishedAt"] = new Date().toISOString();
    }

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ANNOUNCEMENT#${announcementId}`,
          SK: `METADATA`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "ANNOUNCEMENT_UPDATED", {
      targetEntity: `ANNOUNCEMENT#${announcementId}`,
      updates,
    });

    return result.Attributes;
  }

  /**
   * Delete announcement
   * Requirements: 11.1
   * @param {string} announcementId - Announcement ID
   * @param {string} adminId - Admin performing the deletion
   * @returns {Promise<void>}
   */
  static async deleteAnnouncement(announcementId, adminId) {
    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ANNOUNCEMENT#${announcementId}`,
          SK: `METADATA`,
        },
        UpdateExpression: "SET #status = :status, updatedAt = :now",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "archived",
          ":now": new Date().toISOString(),
        },
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "ANNOUNCEMENT_DELETED", {
      targetEntity: `ANNOUNCEMENT#${announcementId}`,
    });
  }

  /**
   * Create notification template
   * Requirements: 11.3, 11.4
   * @param {Object} templateData - Template information
   * @returns {Promise<Object>} Created template
   */
  static async createNotificationTemplate(templateData) {
    const templateId = uuidv4();
    const timestamp = new Date().toISOString();

    const template = {
      PK: `TEMPLATE#${templateId}`,
      SK: `METADATA`,
      GSI1PK: `TEMPLATES#${templateData.category || "general"}`,
      GSI1SK: `NAME#${templateData.name}`,
      entityType: "NotificationTemplate",
      templateId,
      name: templateData.name,
      category: templateData.category || "general",
      subject: templateData.subject,
      body: templateData.body,
      variables: templateData.variables || [],
      channels: templateData.channels || ["email"],
      isActive: templateData.isActive !== false,
      createdBy: templateData.createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: template,
      })
    );

    return template;
  }

  /**
   * Get all notification templates
   * Requirements: 11.3, 11.4
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Templates and pagination info
   */
  static async getAllNotificationTemplates({
    category,
    limit = 50,
    lastEvaluatedKey,
  } = {}) {
    let params;

    if (category) {
      // Query by category using GSI1
      params = {
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :categoryPK",
        ExpressionAttributeValues: {
          ":categoryPK": `TEMPLATES#${category}`,
        },
        Limit: limit,
      };
    } else {
      // Scan all templates
      params = {
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "NotificationTemplate",
        },
        Limit: limit,
      };
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const command = category
      ? new QueryCommand(params)
      : new ScanCommand(params);
    const result = await dynamoDb.send(command);

    return {
      templates: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
      count: result.Count,
    };
  }

  /**
   * Send targeted notification
   * Requirements: 11.2, 11.3, 11.5
   * @param {Object} notificationData - Notification information
   * @returns {Promise<Object>} Notification record
   */
  static async sendTargetedNotification(notificationData) {
    const notificationId = uuidv4();
    const timestamp = new Date().toISOString();

    const notification = {
      PK: `NOTIFICATION#${notificationId}`,
      SK: `METADATA`,
      GSI1PK: `NOTIFICATIONS#${notificationData.status || "pending"}`,
      GSI1SK: `SENT#${timestamp}`,
      entityType: "Notification",
      notificationId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || "info",
      targetUserIds: notificationData.targetUserIds || [],
      targetRoles: notificationData.targetRoles || [],
      targetCriteria: notificationData.targetCriteria || {},
      channels: notificationData.channels || ["in_app"],
      templateId: notificationData.templateId || null,
      status: notificationData.status || "pending", // pending, sent, failed
      sentAt: notificationData.status === "sent" ? timestamp : null,
      deliveryStats: {
        total: notificationData.targetUserIds?.length || 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
      },
      createdBy: notificationData.createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: notification,
      })
    );

    return notification;
  }

  /**
   * Get notification delivery statistics
   * Requirements: 11.5
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Delivery statistics
   */
  static async getNotificationStats(notificationId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `NOTIFICATION#${notificationId}`,
          SK: `METADATA`,
        },
      })
    );

    return result.Item?.deliveryStats || null;
  }

  /**
   * Update notification delivery status
   * Requirements: 11.5
   * @param {string} notificationId - Notification ID
   * @param {Object} stats - Updated statistics
   * @returns {Promise<Object>} Updated notification
   */
  static async updateNotificationStats(notificationId, stats) {
    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `NOTIFICATION#${notificationId}`,
          SK: `METADATA`,
        },
        UpdateExpression:
          "SET deliveryStats = :stats, #status = :status, updatedAt = :now",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":stats": stats,
          ":status": "sent",
          ":now": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  }

  /**
   * Get system health metrics and performance monitoring
   * Requirements: 12.1, 12.2, 12.4
   * @param {Object} options - Query options
   * @param {string} options.timeRange - Time range for metrics (1h, 24h, 7d)
   * @returns {Promise<Object>} System health metrics
   */
  static async getSystemHealth({ timeRange = "1h" } = {}) {
    // In a production environment, this would query actual system metrics
    // For now, we'll return simulated data
    const now = new Date();
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    return {
      status: "healthy",
      uptime: `${hours}h ${minutes}m`,
      timestamp: now.toISOString(),
      timeRange,
      metrics: {
        cpuUsage: Math.random() * 30 + 20, // 20-50%
        memoryUsage: Math.random() * 20 + 40, // 40-60%
        diskUsage: Math.random() * 15 + 30, // 30-45%
      },
      services: {
        api: "operational",
        database: "operational",
        storage: "operational",
      },
    };
  }

  /**
   * Get database health and query performance metrics
   * Requirements: 12.1, 12.2
   * @param {Object} options - Query options
   * @param {string} options.timeRange - Time range for metrics
   * @returns {Promise<Object>} Database health metrics
   */
  static async getDatabaseHealth({ timeRange = "1h" } = {}) {
    // In a production environment, this would query actual DynamoDB metrics
    // For now, we'll return simulated data
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      timeRange,
      averageQueryTime: Math.floor(Math.random() * 50 + 10), // 10-60ms
      totalQueries: Math.floor(Math.random() * 10000 + 5000),
      slowQueries: Math.floor(Math.random() * 10),
      connectionPoolUsage: Math.floor(Math.random() * 30 + 20), // 20-50%
      tableSize: "2.5 GB",
      readCapacity: {
        consumed: Math.floor(Math.random() * 100 + 50),
        provisioned: 200,
        utilization: Math.floor(Math.random() * 50 + 25), // 25-75%
      },
      writeCapacity: {
        consumed: Math.floor(Math.random() * 50 + 20),
        provisioned: 100,
        utilization: Math.floor(Math.random() * 40 + 20), // 20-60%
      },
    };
  }

  /**
   * Get API response time monitoring and error rate tracking
   * Requirements: 12.1, 12.4
   * @param {Object} options - Query options
   * @param {string} options.timeRange - Time range for metrics
   * @param {string} options.endpoint - Specific endpoint to filter
   * @returns {Promise<Object>} API metrics
   */
  static async getApiMetrics({ timeRange = "1h", endpoint = null } = {}) {
    // In a production environment, this would query actual API metrics
    // For now, we'll return simulated data
    const totalRequests = Math.floor(Math.random() * 50000 + 10000);
    const errorCount = Math.floor(Math.random() * 100 + 10);

    const endpoints = [
      {
        endpoint: "/api/courses",
        method: "GET",
        requestCount: Math.floor(Math.random() * 5000 + 1000),
        averageResponseTime: Math.floor(Math.random() * 100 + 50),
        errorRate: Math.random() * 2,
        status: "healthy",
      },
      {
        endpoint: "/api/users",
        method: "GET",
        requestCount: Math.floor(Math.random() * 3000 + 500),
        averageResponseTime: Math.floor(Math.random() * 80 + 40),
        errorRate: Math.random() * 1.5,
        status: "healthy",
      },
      {
        endpoint: "/api/enrollments",
        method: "POST",
        requestCount: Math.floor(Math.random() * 2000 + 300),
        averageResponseTime: Math.floor(Math.random() * 150 + 100),
        errorRate: Math.random() * 3,
        status: "healthy",
      },
      {
        endpoint: "/api/admin/dashboard",
        method: "GET",
        requestCount: Math.floor(Math.random() * 1000 + 100),
        averageResponseTime: Math.floor(Math.random() * 200 + 150),
        errorRate: Math.random() * 1,
        status: "healthy",
      },
    ];

    return {
      timestamp: new Date().toISOString(),
      timeRange,
      totalRequests,
      errorCount,
      errorRate: (errorCount / totalRequests) * 100,
      averageResponseTime: Math.floor(Math.random() * 120 + 80), // 80-200ms
      endpointMetrics: endpoint
        ? endpoints.filter((e) => e.endpoint === endpoint)
        : endpoints,
    };
  }

  /**
   * Get real-time system performance metrics
   * Requirements: 12.1, 12.4
   * @returns {Promise<Object>} Real-time metrics
   */
  static async getRealTimeSystemMetrics() {
    const memUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      cpuUsage: Math.random() * 30 + 20, // Simulated: 20-50%
      memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      memoryDetails: {
        heapUsed: Math.floor(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.floor(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.floor(memUsage.external / 1024 / 1024), // MB
      },
      activeConnections: Math.floor(Math.random() * 50 + 10),
      requestsPerSecond: Math.floor(Math.random() * 100 + 20),
      uptime: process.uptime(),
    };
  }

  /**
   * Perform data cleanup operations
   * Requirements: 12.3, 12.5
   * @param {Object} options - Cleanup options
   * @param {string} options.cleanupType - Type of cleanup (audit_logs, old_sessions, etc.)
   * @param {number} options.daysOld - Age threshold in days
   * @param {boolean} options.dryRun - Whether to perform a dry run
   * @param {string} options.adminId - Admin performing the cleanup
   * @returns {Promise<Object>} Cleanup results
   */
  static async performDataCleanup({
    cleanupType,
    daysOld = 90,
    dryRun = true,
    adminId,
  } = {}) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffTimestamp = cutoffDate.toISOString();

    let itemsAffected = 0;
    let itemsDeleted = 0;

    // Simulate cleanup based on type
    switch (cleanupType) {
      case "audit_logs":
        // In production, would query and delete old audit logs
        itemsAffected = Math.floor(Math.random() * 1000 + 100);
        itemsDeleted = dryRun ? 0 : itemsAffected;
        break;
      case "old_sessions":
        itemsAffected = Math.floor(Math.random() * 500 + 50);
        itemsDeleted = dryRun ? 0 : itemsAffected;
        break;
      case "expired_notifications":
        itemsAffected = Math.floor(Math.random() * 300 + 30);
        itemsDeleted = dryRun ? 0 : itemsAffected;
        break;
      default:
        throw new Error(`Unknown cleanup type: ${cleanupType}`);
    }

    return {
      cleanupType,
      daysOld,
      cutoffDate: cutoffTimestamp,
      itemsAffected,
      itemsDeleted,
      dryRun,
      performedAt: new Date().toISOString(),
      performedBy: adminId,
    };
  }

  /**
   * Get storage optimization metrics
   * Requirements: 12.3
   * @returns {Promise<Object>} Storage metrics
   */
  static async getStorageMetrics() {
    // In production, would query actual storage metrics from DynamoDB and S3
    return {
      timestamp: new Date().toISOString(),
      database: {
        totalSize: "2.5 GB",
        tableCount: 1,
        itemCount: Math.floor(Math.random() * 100000 + 50000),
        indexSize: "500 MB",
      },
      storage: {
        totalUsed: "15.3 GB",
        totalAvailable: "100 GB",
        usagePercentage: 15.3,
        fileCount: Math.floor(Math.random() * 5000 + 1000),
        categories: {
          courseContent: "8.2 GB",
          userUploads: "4.1 GB",
          certificates: "2.5 GB",
          other: "0.5 GB",
        },
      },
      recommendations: [
        {
          type: "cleanup",
          priority: "low",
          message: "Consider archiving audit logs older than 90 days",
          potentialSavings: "200 MB",
        },
      ],
    };
  }

  /**
   * Create data backup
   * Requirements: 12.3, 12.5
   * @param {Object} options - Backup options
   * @param {string} options.backupType - Type of backup (full, incremental, selective)
   * @param {Array} options.includeData - Data types to include
   * @param {string} options.adminId - Admin creating the backup
   * @returns {Promise<Object>} Backup record
   */
  static async createDataBackup({
    backupType,
    includeData = [],
    adminId,
  } = {}) {
    const backupId = uuidv4();
    const timestamp = new Date().toISOString();

    const backup = {
      PK: `BACKUP#${backupId}`,
      SK: `METADATA`,
      GSI1PK: `BACKUPS#${backupType}`,
      GSI1SK: `CREATED#${timestamp}`,
      entityType: "Backup",
      backupId,
      backupType,
      includeData,
      status: "in_progress", // in_progress, completed, failed
      size: null,
      location: null,
      createdBy: adminId,
      createdAt: timestamp,
      completedAt: null,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: backup,
      })
    );

    // Simulate backup completion (in production, this would be async)
    setTimeout(async () => {
      await dynamoDb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `BACKUP#${backupId}`,
            SK: `METADATA`,
          },
          UpdateExpression:
            "SET #status = :status, #size = :size, location = :location, completedAt = :completedAt",
          ExpressionAttributeNames: {
            "#status": "status",
            "#size": "size",
          },
          ExpressionAttributeValues: {
            ":status": "completed",
            ":size": "2.5 GB",
            ":location": `s3://backups/${backupId}.tar.gz`,
            ":completedAt": new Date().toISOString(),
          },
        })
      );
    }, 1000);

    return backup;
  }

  /**
   * Get all backups with filtering
   * Requirements: 12.3
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Backups and pagination info
   */
  static async getAllBackups({ limit = 50, lastEvaluatedKey } = {}) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "Backup",
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const result = await dynamoDb.send(new ScanCommand(params));

    return {
      backups: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
      count: result.Count,
    };
  }

  /**
   * Restore data from backup
   * Requirements: 12.3, 12.5
   * @param {string} backupId - Backup ID to restore from
   * @param {Object} restoreOptions - Restore options
   * @param {string} adminId - Admin performing the restore
   * @returns {Promise<Object>} Restore result
   */
  static async restoreFromBackup(backupId, restoreOptions, adminId) {
    // Get backup details
    const backup = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BACKUP#${backupId}`,
          SK: `METADATA`,
        },
      })
    );

    if (!backup.Item) {
      throw new Error("Backup not found");
    }

    if (backup.Item.status !== "completed") {
      throw new Error("Backup is not completed");
    }

    // In production, this would perform actual restore operations
    // For now, we'll simulate the restore
    const restoreId = uuidv4();

    await this.logAdminAction(adminId, "BACKUP_RESTORE_STARTED", {
      backupId,
      restoreId,
      restoreOptions,
    });

    return {
      restoreId,
      backupId,
      status: "in_progress",
      itemsRestored: 0,
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };
  }

  /**
   * Schedule maintenance window
   * Requirements: 12.5
   * @param {Object} maintenanceData - Maintenance window information
   * @returns {Promise<Object>} Maintenance window record
   */
  static async scheduleMaintenanceWindow(maintenanceData) {
    const maintenanceId = uuidv4();
    const timestamp = new Date().toISOString();

    const maintenance = {
      PK: `MAINTENANCE#${maintenanceId}`,
      SK: `METADATA`,
      GSI1PK: `MAINTENANCE#${maintenanceData.status || "scheduled"}`,
      GSI1SK: `START#${maintenanceData.startTime}`,
      entityType: "MaintenanceWindow",
      maintenanceId,
      title: maintenanceData.title,
      description: maintenanceData.description,
      startTime: maintenanceData.startTime,
      endTime: maintenanceData.endTime,
      maintenanceType: maintenanceData.maintenanceType,
      affectedServices: maintenanceData.affectedServices || [],
      status: "scheduled", // scheduled, in_progress, completed, cancelled
      notifyUsers: maintenanceData.notifyUsers !== false,
      scheduledBy: maintenanceData.scheduledBy,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: maintenance,
      })
    );

    return maintenance;
  }

  /**
   * Get all maintenance windows
   * Requirements: 12.5
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Maintenance windows and pagination info
   */
  static async getAllMaintenanceWindows({
    status,
    limit = 50,
    lastEvaluatedKey,
  } = {}) {
    let params;

    if (status) {
      // Query by status using GSI1
      params = {
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :statusPK",
        ExpressionAttributeValues: {
          ":statusPK": `MAINTENANCE#${status}`,
        },
        Limit: limit,
        ScanIndexForward: false, // Most recent first
      };
    } else {
      // Scan all maintenance windows
      params = {
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "MaintenanceWindow",
        },
        Limit: limit,
      };
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const command = status ? new QueryCommand(params) : new ScanCommand(params);
    const result = await dynamoDb.send(command);

    return {
      maintenanceWindows: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
      count: result.Count,
    };
  }

  /**
   * Update maintenance window status
   * Requirements: 12.5
   * @param {string} maintenanceId - Maintenance window ID
   * @param {Object} updates - Updates to apply
   * @param {string} adminId - Admin performing the update
   * @returns {Promise<Object>} Updated maintenance window
   */
  static async updateMaintenanceWindow(maintenanceId, updates, adminId) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
      ":updatedAt": new Date().toISOString(),
    };

    // Build dynamic update expression
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== "maintenanceId") {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });

    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";

    // Update GSI keys if status changed
    if (updates.status) {
      updateExpressions.push("#GSI1PK = :GSI1PK");
      expressionAttributeNames["#GSI1PK"] = "GSI1PK";
      expressionAttributeValues[":GSI1PK"] = `MAINTENANCE#${updates.status}`;
    }

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `MAINTENANCE#${maintenanceId}`,
          SK: `METADATA`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    // Log the action
    await this.logAdminAction(adminId, "MAINTENANCE_UPDATED", {
      targetEntity: `MAINTENANCE#${maintenanceId}`,
      updates,
    });

    return result.Attributes;
  }
}

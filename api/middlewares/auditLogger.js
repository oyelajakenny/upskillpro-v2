import { v4 as uuidv4 } from "uuid";
import dynamoDb, { TABLE_NAME } from "../config/dynamodb.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { hasAdminPrivileges } from "../utils/constants.js";

/**
 * Middleware to log admin actions for audit trail
 */
const auditLogger = (action) => {
  return async (req, res, next) => {
    // Only log actions for users with admin privileges
    if (!req.user || !hasAdminPrivileges(req.user.role)) {
      return next();
    }

    const originalSend = res.send;
    const originalJson = res.json;

    // Capture response data
    let responseData = null;
    let statusCode = null;

    res.send = function (data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalSend.call(this, data);
    };

    res.json = function (data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log the action after response is sent (in background)
    res.on("finish", async () => {
      try {
        await logAdminAction({
          adminId: req.user.sub,
          action: action || `${req.method} ${req.originalUrl}`,
          method: req.method,
          url: req.originalUrl,
          requestBody: req.body,
          responseStatus: statusCode,
          responseData: responseData,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to log admin action:", error);
      }
    });
  };
};

/**
 * Log an admin action to the audit trail
 * @param {Object} actionData - Action data to log
 */
async function logAdminAction(actionData) {
  const actionId = uuidv4();
  const timestamp = actionData.timestamp || new Date().toISOString();

  const auditItem = {
    PK: `ADMIN#${actionData.adminId}`,
    SK: `ACTION#${timestamp}#${actionId}`,
    GSI8PK: `AUDIT#${actionData.adminId}`,
    GSI8SK: `ACTION#${timestamp}#${actionId}`,
    entityType: "AdminAction",
    actionId,
    adminId: actionData.adminId,
    action: actionData.action,
    method: actionData.method,
    url: actionData.url,
    requestBody: actionData.requestBody,
    responseStatus: actionData.responseStatus,
    responseData: actionData.responseData,
    ipAddress: actionData.ipAddress,
    userAgent: actionData.userAgent,
    timestamp,
  };

  await dynamoDb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: auditItem,
    })
  );
}

export default auditLogger;
export { logAdminAction };

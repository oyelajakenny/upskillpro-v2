import dynamoDb, { TABLE_NAME } from "../../config/dynamodb.js";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export class CategoryRepository {
  /**
   * Retrieve all categories using GSI3
   * @returns {Promise<Array>} Array of category objects
   */
  static async findAll() {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :categoryType",
        ExpressionAttributeValues: {
          ":categoryType": "CATEGORY",
        },
        ScanIndexForward: true, // Sort by name ascending
      })
    );

    return result.Items || [];
  }

  /**
   * Get a single category by ID
   * @param {string} categoryId - The category ID
   * @returns {Promise<Object|null>} Category object or null if not found
   */
  static async findById(categoryId) {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${categoryId}`,
          SK: "METADATA",
        },
      })
    );

    return result.Item || null;
  }

  /**
   * Create a new category
   * @param {Object} params - Category parameters
   * @param {string} params.name - Category name
   * @param {string} params.description - Category description
   * @param {string} params.slug - URL-friendly slug
   * @returns {Promise<Object>} Created category object
   */
  static async create({ name, description, slug }) {
    const categoryId = uuidv4();
    const timestamp = new Date().toISOString();

    const item = {
      PK: `CATEGORY#${categoryId}`,
      SK: "METADATA",
      GSI3PK: "CATEGORY",
      GSI3SK: `NAME#${name}`,
      entityType: "Category",
      categoryId,
      name,
      description,
      slug,
      createdAt: timestamp,
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
   * Seed initial categories into the database
   * @returns {Promise<Array>} Array of created category objects
   */
  static async seedCategories() {
    const categories = [
      {
        name: "Web Development",
        description: "Frontend, backend, and full-stack web development",
        slug: "web-development",
      },
      {
        name: "Mobile Development",
        description: "iOS, Android, and cross-platform mobile apps",
        slug: "mobile-development",
      },
      {
        name: "Data Science",
        description: "Data analysis, machine learning, and AI",
        slug: "data-science",
      },
      {
        name: "Design",
        description: "UI/UX design, graphic design, and visual arts",
        slug: "design",
      },
      {
        name: "Business",
        description: "Entrepreneurship, marketing, and management",
        slug: "business",
      },
      {
        name: "Programming",
        description: "General programming languages and concepts",
        slug: "programming",
      },
      {
        name: "Cloud Computing",
        description: "AWS, Azure, GCP, and DevOps",
        slug: "cloud-computing",
      },
      {
        name: "Cybersecurity",
        description: "Security, ethical hacking, and privacy",
        slug: "cybersecurity",
      },
    ];

    const timestamp = new Date().toISOString();
    const createdCategories = [];

    // Create items for batch write
    const putRequests = categories.map((category) => {
      const categoryId = uuidv4();
      const item = {
        PK: `CATEGORY#${categoryId}`,
        SK: "METADATA",
        GSI3PK: "CATEGORY",
        GSI3SK: `NAME#${category.name}`,
        entityType: "Category",
        categoryId,
        name: category.name,
        description: category.description,
        slug: category.slug,
        createdAt: timestamp,
      };
      createdCategories.push(item);
      return {
        PutRequest: {
          Item: item,
        },
      };
    });

    // DynamoDB BatchWrite supports max 25 items, but we have 8
    await dynamoDb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: putRequests,
        },
      })
    );

    return createdCategories;
  }
}

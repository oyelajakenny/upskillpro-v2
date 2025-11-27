# Backend Integration Tests

This directory contains integration tests for the category feature in the UpSkillPro API.

## Test Files

- `category.integration.test.js` - Tests for category API endpoints
- `course-category.integration.test.js` - Tests for course operations with categories

## Prerequisites

Before running the tests, ensure you have:

1. Node.js and npm installed
2. DynamoDB table created and configured
3. Categories seeded in the database
4. Environment variables configured in `.env` file

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create DynamoDB table (if not already created):

```bash
npm run dynamodb:create-table
```

3. Seed categories:

```bash
npm run seed:categories
```

## Running Tests

Run all tests:

```bash
npm test
```

Run only category integration tests:

```bash
npx jest --testPathPattern=category
```

Run with coverage:

```bash
npx jest --coverage
```

Run in watch mode (for development):

```bash
npx jest --watch
```

## Test Coverage

The integration tests cover:

### Category API Tests

- GET /api/categories - Retrieve all categories
- GET /api/categories/:id - Retrieve specific category
- Error handling for non-existent categories
- Response structure validation

### Course with Category Tests

- POST /api/courses with categoryId - Create course with category
- POST /api/courses with invalid categoryId - Validation
- POST /api/courses without categoryId - Optional category
- GET /api/courses?categoryId=<id> - Filter courses by category
- Category validation in course operations
- Category information in course responses

## Test Data

The tests use:

- Mock instructor user (test-instructor-id)
- Seeded categories from the database
- Dynamically created test courses

## Troubleshooting

### Tests fail with "Category not found"

- Ensure categories are seeded: `npm run seed:categories`

### Tests fail with DynamoDB errors

- Check AWS credentials in `.env`
- Verify DynamoDB table exists
- Check network connectivity to DynamoDB

### Tests timeout

- Increase timeout in jest.config.js (currently 30000ms)
- Check DynamoDB performance

## Notes

- Tests use the actual DynamoDB database (not mocked)
- Test data is created during test execution
- Some test data may persist after tests complete
- Tests require valid AWS credentials and DynamoDB access

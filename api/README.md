# The API Package

This package sets up an [Express](https://expressjs.com/) API server with Amazon DynamoDB as the database.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env-example` to `.env` and fill in your AWS credentials:

```bash
cp .env-example .env
```

### 3. Create DynamoDB Table

```bash
npm run dynamodb:create-table
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3001/api](http://localhost:3001/api) to test the connection.

## Database: DynamoDB

This project uses **Amazon DynamoDB** with a single-table design for optimal performance and scalability.

### Why DynamoDB?

- ✅ Unlimited scalability
- ✅ Single-digit millisecond latency
- ✅ Serverless (no server management)
- ✅ Pay-per-use pricing
- ✅ Built-in replication and backup

### Migration from PostgreSQL

If you're migrating from the old PostgreSQL setup, see:

- **[Migration Guide](docs/MIGRATION_GUIDE.md)** - Step-by-step instructions
- **[DynamoDB Design](docs/DYNAMODB_DESIGN.md)** - Table structure and access patterns
- **[Query Examples](docs/QUERY_EXAMPLES.md)** - PostgreSQL to DynamoDB translations

## Environment Variables

Create a `.env` file with these variables:

```env
# API Configuration
PORT=3001

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
DYNAMODB_TABLE_NAME=LearningPlatform

# AWS S3 Configuration
AWS_S3_BASE_URL=https://your-bucket.s3.amazonaws.com

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here
```

## Available Scripts

```bash
npm run dev                    # Start development server with hot reload
npm run start                  # Start production server
npm run dynamodb:create-table  # Create DynamoDB table with GSIs
npm run dynamodb:migrate       # Migrate data from PostgreSQL (if applicable)
npm run cleanup:postgres       # Remove old PostgreSQL files
npm run format                 # Format code with Prettier
npm run check                  # Lint code with ESLint
npm test                       # Run tests
```

## Project Structure

```
api/
├── config/
│   └── dynamodb.js           # DynamoDB client configuration
├── controllers/
│   └── dynamodb/             # DynamoDB-based controllers
│       ├── authController.js
│       ├── courseController.js
│       ├── enrollmentController.js
│       ├── lectureController.js
│       ├── progressController.js
│       └── userController.js
├── models/
│   └── dynamodb/             # Data access layer (repositories)
│       ├── user-repository.js
│       ├── course-repository.js
│       ├── enrollment-repository.js
│       └── lecture-repository.js
├── scripts/
│   ├── create-dynamodb-table.js
│   ├── migrate-postgres-to-dynamodb.js
│   └── cleanup-postgres-files.js
├── docs/
│   ├── DYNAMODB_DESIGN.md    # Table design and access patterns
│   ├── MIGRATION_GUIDE.md    # PostgreSQL to DynamoDB migration
│   ├── QUERY_EXAMPLES.md     # Query translation examples
│   ├── QUICK_REFERENCE.md    # Common operations reference
│   ├── POSTGRES_VS_DYNAMODB.md # Feature comparison
│   └── TROUBLESHOOTING.md    # Common issues and solutions
└── src/
    └── index.js              # Express server entry point
```

## Data Model

The application uses a **single-table design** with the following entities:

| Entity     | Partition Key | Sort Key                | Description             |
| ---------- | ------------- | ----------------------- | ----------------------- |
| User       | `USER#<id>`   | `PROFILE`               | User profile data       |
| Course     | `COURSE#<id>` | `METADATA`              | Course information      |
| Lecture    | `COURSE#<id>` | `LECTURE#<id>`          | Course lectures         |
| Enrollment | `USER#<id>`   | `ENROLLMENT#<courseId>` | User course enrollments |

### Global Secondary Indexes (GSIs)

1. **GSI1** - Query courses by instructor
2. **GSI2** - Query enrollments by course
3. **GSI3** - List all courses with sorting
4. **GSI4** - Find users by email (login)

See [DYNAMODB_DESIGN.md](docs/DYNAMODB_DESIGN.md) for complete details.

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/users` - User registration

### Users

- `GET /api/users/me` - Get current user profile

### Courses

- `GET /api/courses` - List all courses (with filters)
- `GET /api/courses/:id` - Get course details with lectures
- `POST /api/courses` - Create course (instructor only)
- `PUT /api/courses/:id` - Update course (instructor only)
- `GET /api/courses/instructor` - Get instructor's courses

### Enrollments

- `POST /api/enrollments/:id` - Enroll in course
- `GET /api/enrollments` - Get user's enrolled courses
- `GET /api/enrollments/:id/students` - Count enrolled students
- `GET /api/enrollments/revenue` - Get instructor revenue

### Lectures

- `POST /api/courses/:id/lectures` - Add lecture to course
- `GET /api/courses/:id/lectures` - Get course lectures

### Progress

- `GET /api/progress/:id` - Get course progress
- `PUT /api/progress/:id` - Update lecture progress
- `PUT /api/progress/:id/complete` - Mark all lectures complete
- `DELETE /api/progress/:id` - Reset progress

### Ratings

- `POST /api/courses/:courseId/ratings` - Submit or update course rating (authenticated)
- `GET /api/courses/:courseId/ratings` - Get all ratings for a course
- `GET /api/courses/:courseId/ratings/me` - Get current user's rating (authenticated)
- `DELETE /api/courses/:courseId/ratings` - Delete user's rating (authenticated)
- `GET /api/courses/:courseId/ratings/stats` - Get rating statistics for a course
- `GET /api/instructor/ratings` - Get ratings for instructor's courses (authenticated)

## Documentation

- **[DynamoDB Design](docs/DYNAMODB_DESIGN.md)** - Complete table design and access patterns
- **[Migration Guide](docs/MIGRATION_GUIDE.md)** - PostgreSQL to DynamoDB migration steps
- **[Query Examples](docs/QUERY_EXAMPLES.md)** - SQL to DynamoDB query translations
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Common operations and repository methods
- **[Comparison](docs/POSTGRES_VS_DYNAMODB.md)** - PostgreSQL vs DynamoDB features
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Deploying to AWS

### Prerequisites

1. AWS Account
2. IAM user with DynamoDB permissions
3. AWS credentials configured

### Deployment Steps

1. **Create DynamoDB Table**

   ```bash
   npm run dynamodb:create-table
   ```

2. **Deploy to AWS Lambda + API Gateway** (recommended)

   - Use AWS SAM or Serverless Framework
   - Configure environment variables
   - Deploy with `sam deploy` or `serverless deploy`

3. **Or Deploy to EC2/ECS**

   - Set up EC2 instance or ECS cluster
   - Configure environment variables
   - Run `npm start`

4. **Configure Environment Variables**
   - Set AWS credentials
   - Set DynamoDB table name
   - Set JWT secret
   - Set S3 bucket URL

### Production Considerations

- **Enable Point-in-Time Recovery** for DynamoDB table
- **Set up CloudWatch Alarms** for throttling and errors
- **Use AWS Secrets Manager** for sensitive credentials
- **Enable DynamoDB Auto Scaling** or use on-demand billing
- **Set up API Gateway** with rate limiting
- **Use CloudFront** for CDN and DDoS protection
- **Enable AWS WAF** for additional security

## Development

### Local DynamoDB

For local development without AWS:

```bash
# Run DynamoDB Local with Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Update config/dynamodb.js for local endpoint
endpoint: "http://localhost:8000"
```

### Testing

```bash
npm test
```

## Troubleshooting

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

Quick checks:

- Verify AWS credentials are correct
- Check DynamoDB table exists and is active
- Verify all GSIs are active
- Check CloudWatch logs for errors
- Use AWS Console to inspect table items

## Support

- AWS DynamoDB Docs: https://docs.aws.amazon.com/dynamodb/
- AWS SDK for JavaScript: https://docs.aws.amazon.com/sdk-for-javascript/
- Project Documentation: See `docs/` folder

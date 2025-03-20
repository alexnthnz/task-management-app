# Task Management Application

A full-stack task management application built with React, Express.js, TypeScript, and DynamoDB.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [AWS Deployment](#aws-deployment)
  - [Prerequisites](#aws-prerequisites)
  - [Infrastructure Setup](#infrastructure-setup)
  - [Deployment Steps](#deployment-steps)
- [Architecture](#architecture)
- [Assumptions](#assumptions)
- [API Documentation](#api-documentation)

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- AWS CLI (configured with appropriate credentials)
- Terraform (v1.0 or higher)
- Git

## Local Development

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   The default configuration in `.env`:
   ```
   PORT=3001
   NODE_ENV=development
   DYNAMODB_TABLE=dev-task-management-tasks
   AWS_REGION=ap-southeast-2
   DYNAMODB_ENDPOINT=http://localhost:8000
   AWS_ACCESS_KEY_ID=local
   AWS_SECRET_ACCESS_KEY=local
   ```

4. **Start DynamoDB Local**
   ```bash
   # Start DynamoDB Local and Admin UI
   docker-compose up -d

   # Wait for DynamoDB to be ready (about 5 seconds)
   sleep 5

   # Create DynamoDB table
   aws dynamodb create-table --table-name dev-task-management-tasks --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --endpoint-url http://localhost:8000
   ```

   This will start:
   - DynamoDB Local on port 8000
   - DynamoDB Admin UI on port 8001
   - Create the required table with GSI for status-based queries

   You can verify the table creation:
   ```bash
   aws dynamodb list-tables --endpoint-url http://localhost:8000
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The backend server will start on http://localhost:3001

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure the following in `.env`:
   ```
   VITE_API_URL=http://localhost:3001
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The frontend application will start on http://localhost:3000

## AWS Deployment

### AWS Prerequisites

1. **AWS Account Setup**
   - Active AWS account
   - IAM user with appropriate permissions
   - AWS CLI configured with credentials

2. **Required AWS Permissions**
   - DynamoDB full access
   - S3 full access
   - CloudFront full access
   - IAM role creation permissions
   - Lambda full access
   - API Gateway full access

### Infrastructure Setup

The application uses Terraform to provision the following AWS resources:

- DynamoDB table
- S3 bucket for frontend hosting
- CloudFront distribution
- API Gateway
- Lambda functions
- ACM certificates
- Route53 records
- IAM roles and policies

1. **Initialize Terraform**
   ```bash
   cd terraform
   terraform init
   ```

2. **Configure Terraform Variables**
   Create a `terraform.tfvars` file:
   ```hcl
   aws_region     = "ap-southeast-2"
   environment    = "production"
   domain_name    = "your-domain.com"
   ```

3. **Plan Infrastructure Changes**
   ```bash
   terraform plan -out=tfplan
   ```

4. **Apply Infrastructure**
   ```bash
   terraform apply tfplan
   ```

### Deployment Steps

1. **Build Applications**
   ```bash
   # Build backend
   cd backend
   npm run build

   # Build frontend
   cd ../frontend
   npm run build
   ```

2. **Deploy Backend**
   ```bash
   # Package Lambda function
   npm run package

   # Deploy to AWS Lambda
   aws lambda update-function-code \
     --function-name task-management-api \
     --zip-file fileb://dist/function.zip
   ```

3. **Deploy Frontend**
   ```bash
   # Upload to S3
   aws s3 sync dist/ s3://your-bucket-name

   # Invalidate CloudFront cache
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

## Architecture

```
Frontend (React + TypeScript)
  │
  ├── CloudFront Distribution
  │   └── S3 Bucket (Static Hosting)
  │
Backend (Express + TypeScript)
  │
  ├── API Gateway
  │   └── Lambda Function
  │       └── DynamoDB Table
```

## Assumptions

1. **Authentication & Authorization**
   - Currently implemented as a public API
   - Future enhancement: Add JWT-based auth

2. **Data Model**
   - Tasks have unique IDs (UUID v4)
   - Status transitions: TODO → IN_PROGRESS → COMPLETED
   - No task history tracking

3. **Scalability**
   - DynamoDB auto-scaling enabled
   - CloudFront caching for frontend assets
   - Lambda concurrency limits considered

4. **Security**
   - CORS enabled for frontend domain
   - HTTPS enforced
   - Environment variables for sensitive data

5. **Monitoring**
   - CloudWatch logs enabled
   - Basic health check endpoint
   - No advanced monitoring implemented

## API Documentation

### Task Status Types
- `TODO`
- `IN_PROGRESS`
- `COMPLETED`

### Endpoints

#### 1. Get All Tasks
```http
GET /api/tasks
```
Query Parameters:
- `status` (optional): Filter by status
- `limit` (optional): Number of items per page
- `nextToken` (optional): Token for pagination

Example:
```bash
# Get all tasks
curl http://localhost:3001/api/tasks

# Filter by status
curl "http://localhost:3001/api/tasks?status=TODO"

# With pagination
curl "http://localhost:3001/api/tasks?limit=10"
```

#### 2. Get Task by ID
```http
GET /api/tasks/:id
```
Query Parameters:
- `status` (required): Current status of the task

Example:
```bash
curl "http://localhost:3001/api/tasks/123e4567-e89b-12d3-a456-426614174000?status=TODO"
```

#### 3. Create Task
```http
POST /api/tasks
```
Request Body:
```json
{
  "title": "Task Title",
  "description": "Task Description",
  "status": "TODO"
}
```
Example:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"title": "New Task", "description": "Task description", "status": "TODO"}' \
  http://localhost:3001/api/tasks
```

#### 4. Update Task
```http
PUT /api/tasks/:id
```
Query Parameters:
- `status` (required): Current status of the task

Request Body:
```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "status": "IN_PROGRESS"
}
```
Example:
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Task", "status": "IN_PROGRESS"}' \
  "http://localhost:3001/api/tasks/123e4567-e89b-12d3-a456-426614174000?status=TODO"
```

#### 5. Delete Task
```http
DELETE /api/tasks/:id
```
Query Parameters:
- `status` (required): Current status of the task

Example:
```bash
curl -X DELETE "http://localhost:3001/api/tasks/123e4567-e89b-12d3-a456-426614174000?status=TODO"
```

## Health Check

```http
GET /health
```
Returns the health status of the API and DynamoDB connection.

Example:
```bash
curl http://localhost:3001/health
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

Error Response Format:
```json
{
  "error": "Error message"
}
```

## Development Tools

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Build**: `npm run build`
- **Tests**: `npm test`

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Remove volumes (will delete all data)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build

# Check container status
docker-compose ps
```

## DynamoDB Local Admin

Access the DynamoDB Local Admin UI at http://localhost:8001 to:
- View and manage tables
- Browse and edit data
- Execute queries
- Monitor table metrics

## Troubleshooting

If you encounter issues with DynamoDB Local:

1. **Table Creation Fails**
   ```bash
   # Delete existing table if needed
   aws dynamodb delete-table \
     --table-name dev-task-management-tasks \
     --endpoint-url http://localhost:8000

   # Wait a few seconds
   sleep 5

   # Try creating the table again
   aws dynamodb create-table --table-name dev-task-management-tasks --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --endpoint-url http://localhost:8000
   ```

2. **DynamoDB Connection Issues**
   - Ensure Docker is running
   - Check if ports 8000 and 8001 are available
   - Verify environment variables are set correctly
   - Try restarting the containers:
     ```bash
     docker-compose down
     docker-compose up -d
     ``` 
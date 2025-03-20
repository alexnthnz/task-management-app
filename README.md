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
- [Health Check](#health-check)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- AWS CLI (configured with appropriate credentials)
- Terraform (v1.0 or higher)
- Git

## Local Development

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd task-management-app/backend
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
    # Server Configuration
    PORT=3001
    NODE_ENV=development

    # DynamoDB Configuration
    DYNAMODB_TABLE=dev-task-management-tasks
    AWS_REGION=ap-southeast-2

    # Local DynamoDB Configuration (for development)
    DYNAMODB_ENDPOINT=http://localhost:8000
    AWS_ACCESS_KEY_ID=local
    AWS_SECRET_ACCESS_KEY=local

    # Logging Configuration
    LOG_LEVEL=debug

    # Security
    CORS_ORIGIN=http://localhost:3000
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
    # API Configuration
    NEXT_PUBLIC_API_URL=http://localhost:3001/api

    # Environment
    NODE_ENV=development
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
   - CloudWatch Logs full access (for API Gateway and Lambda logging)

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

1. **Initialize Pre-deploy Infra & Terraform**

   Configure AWS CLI with your credentials:

   ```bash
   aws configure
   ```

   Initialize Terraform:

   ```bash
   cd infrastructure/environments/prod
   terraform init
   ```

2. **Configure Terraform Variables**
   Create a `secret.tfvars` file:

   ```hcl
   aws_region = "ap-southeast-2"
   stage = "prod"
   app_name = "task-management"
   lambda_zip_key = "lambda-deployment.zip"
   read_capacity = 5
   write_capacity = 5
   frontend_artifacts_bucket_name = "task-management-frontend-artifacts-prod"
   backend_artifacts_bucket_name = "task-management-backend-artifacts-prod"
   dynamodb_table_arn = "arn:aws:dynamodb:ap-southeast-2:<account-id>:table/task-management-tasks-prod"
   ```

3. **Plan Infrastructure Changes**

   For first time deployment, follow these steps:

   - Initialize Pre-deploy Infra:

     - ```bash
         cd infrastructure/scripts
         chmod +x pre-deploy.sh
         ./pre-deploy.sh
       ```
     - This script will create the S3 bucket for storing the artifacts.
     - The script will also create the DynamoDB table in the AWS account.

   - Set Repository Secrets in Github for AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
   - Trigger Github Actions pipeline to deploy the artifacts to S3 bucket
   - Command out the frontend section in `main.tf` and `outputs.tf`. Use Terraform plan and apply to deploy the backend resources.
   - After backend deployment
     - Update the `PROD_API_URL` in Github Secrets with the API Gateway URL from the Terraform output.
     - Trigger Github Actions pipeline to deploy the frontend artifacts to S3 bucket
     - Uncomment the frontend section in `main.tf` and `outputs.tf`. Use Terraform plan and apply to deploy the frontend resources.

   ```bash
   terraform plan -var-file="secret.tfvars" -out=tfplan
   ```

   ```bash
   terraform apply tfplan
   ```

4. Drop Infrastructure

   ```bash
   terraform plan -destroy -var-file="secret.tfvars" -out=tfplan
   ```

   ```bash
   terraform apply tfplan
   ```

   ```bash
   cd infrastructure/scripts
   chmod +x drop-pre-deploy.sh
   ./drop-pre-deploy.sh
   ```

## Architecture

```
Frontend (React + NextJS + TypeScript)
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

3. **Deployment**

   - AWS deployment using Terraform
   - CI/CD pipeline for frontend and backend
   - Manual deployment steps for first-time setup
   - Terraform local state management (need to improve syncing terraform state with S3 bucket for remote state management)

4. **Scalability**

   - DynamoDB auto-scaling enabled
   - CloudFront caching for frontend assets
   - Lambda concurrency limits considered

5. **Security**

   - CORS enabled for frontend domain
   - HTTPS enforced
   - Environment variables for sensitive data

6. **Monitoring**
   - CloudWatch logs enabled
   - Basic health check endpoint
   - No advanced monitoring implemented

## API Documentation

Swagger API documentation is available at http://localhost:3001/api-docs

## Health Check

```http
GET /health
```

Returns the health status of the API and DynamoDB connection.

Example:

```bash
curl http://localhost:3001/health
```

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

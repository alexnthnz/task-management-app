#!/bin/bash

# Variables
AWS_REGION="ap-southeast-2"
APP_NAME="task-management"
STAGE="prod"
BACKEND_BUCKET="${APP_NAME}-backend-artifacts-${STAGE}"
FRONTEND_BUCKET="${APP_NAME}-frontend-artifacts-${STAGE}"
DYNAMODB_TABLE="${APP_NAME}-tasks-${STAGE}"

# Function to check if an S3 bucket exists
check_s3_bucket() {
  local bucket=$1
  if aws s3 ls s3://$bucket --region $AWS_REGION >/dev/null 2>&1; then
    return 0  # Bucket exists
  else
    return 1  # Bucket does not exist
  fi
}

# Function to check if a DynamoDB table exists
check_dynamodb_table() {
  local table=$1
  if aws dynamodb describe-table --table-name $table --region $AWS_REGION >/dev/null 2>&1; then
    return 0  # Table exists
  else
    return 1  # Table does not exist
  fi
}

# Clear and Delete Backend Artifacts S3 Bucket
if check_s3_bucket "$BACKEND_BUCKET"; then
  echo "Clearing all items from S3 bucket: $BACKEND_BUCKET"
  aws s3 rm s3://$BACKEND_BUCKET --recursive --region $AWS_REGION || { echo "Failed to clear $BACKEND_BUCKET"; exit 1; }
  echo "Deleting S3 bucket: $BACKEND_BUCKET"
  aws s3 rb s3://$BACKEND_BUCKET --force --region $AWS_REGION || { echo "Failed to delete $BACKEND_BUCKET"; exit 1; }
else
  echo "S3 bucket $BACKEND_BUCKET does not exist, skipping deletion."
fi

# Clear and Delete Frontend Artifacts S3 Bucket
if check_s3_bucket "$FRONTEND_BUCKET"; then
  echo "Clearing all items from S3 bucket: $FRONTEND_BUCKET"
  aws s3 rm s3://$FRONTEND_BUCKET --recursive --region $AWS_REGION || { echo "Failed to clear $FRONTEND_BUCKET"; exit 1; }
  echo "Deleting S3 bucket: $FRONTEND_BUCKET"
  aws s3 rb s3://$FRONTEND_BUCKET --force --region $AWS_REGION || { echo "Failed to delete $FRONTEND_BUCKET"; exit 1; }
else
  echo "S3 bucket $FRONTEND_BUCKET does not exist, skipping deletion."
fi

# Delete DynamoDB Table
if check_dynamodb_table "$DYNAMODB_TABLE"; then
  echo "Deleting DynamoDB table: $DYNAMODB_TABLE"
  aws dynamodb delete-table --table-name $DYNAMODB_TABLE --region $AWS_REGION || { echo "Failed to delete $DYNAMODB_TABLE"; exit 1; }
  # Wait for table deletion to complete
  echo "Waiting for $DYNAMODB_TABLE to be deleted..."
  aws dynamodb wait table-not-exists --table-name $DYNAMODB_TABLE --region $AWS_REGION || { echo "Failed to wait for $DYNAMODB_TABLE deletion"; exit 1; }
else
  echo "DynamoDB table $DYNAMODB_TABLE does not exist, skipping deletion."
fi

echo "All pre-deploy services dropped successfully!"

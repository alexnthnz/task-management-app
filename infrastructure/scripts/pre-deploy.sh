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
    echo "S3 bucket $bucket already exists."
    return 0  # Bucket exists
  else
    echo "S3 bucket $bucket does not exist."
    return 1  # Bucket does not exist
  fi
}

# Function to check if a DynamoDB table exists
check_dynamodb_table() {
  local table=$1
  if aws dynamodb describe-table --table-name $table --region $AWS_REGION >/dev/null 2>&1; then
    echo "DynamoDB table $table already exists."
    return 0  # Table exists
  else
    echo "DynamoDB table $table does not exist."
    return 1  # Table does not exist
  fi
}

# Create Backend Artifacts S3 Bucket
if ! check_s3_bucket "$BACKEND_BUCKET"; then
  echo "Creating S3 bucket for backend artifacts: $BACKEND_BUCKET"
  aws s3 mb s3://$BACKEND_BUCKET --region $AWS_REGION || { echo "Failed to create $BACKEND_BUCKET"; exit 1; }
else
  echo "Skipping creation of $BACKEND_BUCKET as it already exists."
fi

# Create Frontend Artifacts S3 Bucket and Configure as Website
if ! check_s3_bucket "$FRONTEND_BUCKET"; then
  echo "Creating S3 bucket for frontend artifacts: $FRONTEND_BUCKET"
  aws s3 mb s3://$FRONTEND_BUCKET --region $AWS_REGION || { echo "Failed to create $FRONTEND_BUCKET"; exit 1; }
fi

# Disable Block Public Access for the frontend bucket (only if needed)
echo "Checking and disabling Block Public Access for $FRONTEND_BUCKET"
aws s3api put-public-access-block \
  --bucket $FRONTEND_BUCKET \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" || { echo "Failed to disable Block Public Access"; exit 1; }

# Configure the bucket as a website
echo "Configuring $FRONTEND_BUCKET as a website"
aws s3 website s3://$FRONTEND_BUCKET --index-document index.html --error-document error.html || { echo "Failed to configure website for $FRONTEND_BUCKET"; exit 1; }

# Apply the bucket policy
echo "Applying public bucket policy to $FRONTEND_BUCKET"
aws s3api put-bucket-policy --bucket $FRONTEND_BUCKET --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::'"$FRONTEND_BUCKET"'/*"
  }]
}' || { echo "Failed to set policy for $FRONTEND_BUCKET"; exit 1; }

# Create DynamoDB Table
if ! check_dynamodb_table "$DYNAMODB_TABLE"; then
  echo "Creating DynamoDB table: $DYNAMODB_TABLE"
  aws dynamodb create-table \
    --table-name $DYNAMODB_TABLE \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION || { echo "Failed to create $DYNAMODB_TABLE"; exit 1; }
else
  echo "Skipping creation of $DYNAMODB_TABLE as it already exists."
fi

echo "Infrastructure setup completed successfully!"

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "stage" {
  description = "Deployment stage"
  type        = string
}

variable "lambda_zip_key" {
  description = "S3 key for the Lambda ZIP file"
  type        = string
}

variable "read_capacity" {
  description = "DynamoDB read capacity"
  type        = number
}

variable "write_capacity" {
  description = "DynamoDB write capacity"
  type        = number
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "frontend_artifacts_bucket_name" {
  description = "Frontend artifacts bucket name"
  type        = string
}

variable "backend_artifacts_bucket_name" {
  description = "Backend artifacts bucket name"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

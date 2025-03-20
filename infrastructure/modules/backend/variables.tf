variable "app_name" {
  description = "Application name"
  type        = string
}

variable "stage" {
  description = "Deployment stage (dev/prod)"
  type        = string
}

variable "backend_artifacts_bucket_name" {
  description = "Name of the S3 bucket for backend artifacts"
  type        = string
}

variable "backend_artifacts_bucket_arn" {
  description = "ARN of the S3 bucket for backend artifacts"
  type        = string
}

variable "lambda_zip_key" {
  description = "S3 key for the Lambda ZIP file"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  type        = string
}
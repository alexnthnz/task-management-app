variable "app_name" {
  description = "Application name"
  type        = string
}

variable "stage" {
  description = "Deployment stage (dev/prod)"
  type        = string
}

variable "frontend_artifacts_bucket_name" {
  description = "Name of the S3 bucket for frontend artifacts"
  type        = string
}
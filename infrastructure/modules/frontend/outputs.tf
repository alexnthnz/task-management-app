output "cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  description = "The URL of the CloudFront distribution"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "The ID of the CloudFront distribution"
}

output "s3_bucket_name" {
  value       = var.frontend_artifacts_bucket_name
  description = "The name of the S3 bucket for frontend artifacts"
}

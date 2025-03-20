output "api_url" {
  value       = module.backend.api_url
  description = "The URL of the API Gateway endpoint for the backend"
}

output "cloudfront_url" {
  value = module.frontend.cloudfront_url
}

output "cloudfront_distribution_id" {
  value = module.frontend.cloudfront_distribution_id
}

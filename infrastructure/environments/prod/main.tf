module "backend" {
  source                     = "../../modules/backend"
  app_name                   = var.app_name
  stage                      = var.stage
  backend_artifacts_bucket_name = var.backend_artifacts_bucket_name
  backend_artifacts_bucket_arn  = "arn:aws:s3:::${var.backend_artifacts_bucket_name}"
  lambda_zip_key             = var.lambda_zip_key
  dynamodb_table_arn         = var.dynamodb_table_arn
  aws_region                 = var.aws_region
  cors_origin                = "*" 
}

# module "frontend" {
#   source                      = "../../modules/frontend"
#   app_name                    = var.app_name
#   stage                       = var.stage
#   frontend_artifacts_bucket_name = var.frontend_artifacts_bucket_name
# }

module "dynamodb" {
  source        = "../../modules/dynamodb"
  app_name      = var.app_name
  stage         = var.stage
  read_capacity = var.read_capacity
  write_capacity = var.write_capacity
}

module "backend_artifacts" {
  source   = "../../modules/backend-artifacts"
  app_name = var.app_name
  stage    = var.stage
}

module "frontend_artifacts" {
  source   = "../../modules/frontend-artifacts"
  app_name = var.app_name
  stage    = var.stage
}

module "backend" {
  source                     = "../../modules/backend"
  app_name                   = var.app_name
  stage                      = var.stage
  backend_artifacts_bucket_name = module.backend_artifacts.bucket_name
  backend_artifacts_bucket_arn  = "arn:aws:s3:::${module.backend_artifacts.bucket_name}"
  lambda_zip_key             = var.lambda_zip_key
  dynamodb_table_arn         = module.dynamodb.table_arn
  aws_region                 = var.aws_region
  cors_origin                = "*" 
}

# module "frontend" {
#   source                      = "../../modules/frontend"
#   app_name                    = var.app_name
#   stage                       = var.stage
#   frontend_artifacts_bucket_name = module.frontend_artifacts.bucket_name
# }

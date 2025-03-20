resource "aws_s3_bucket" "backend_artifacts" {
  bucket = "${var.app_name}-backend-artifacts-${var.stage}"
}

resource "aws_s3_bucket_versioning" "backend_artifacts" {
  bucket = aws_s3_bucket.backend_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}
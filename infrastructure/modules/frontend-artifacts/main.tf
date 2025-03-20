resource "aws_s3_bucket" "frontend_artifacts" {
  bucket = "${var.app_name}-frontend-artifacts-${var.stage}"
}

resource "aws_s3_bucket_website_configuration" "frontend_artifacts" {
  bucket = aws_s3_bucket.frontend_artifacts.id
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_artifacts" {
  bucket                  = aws_s3_bucket.frontend_artifacts.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_artifacts" {
  bucket = aws_s3_bucket.frontend_artifacts.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend_artifacts.arn}/*"
    }]
  })
}
resource "aws_iam_role" "lambda_exec" {
  name = "${var.app_name}-lambda-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role_policy" "dynamodb_access" {
  name   = "${var.app_name}-dynamodb-access"
  role   = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:ListTables",
          "dynamodb:DescribeTable",
          "dynamodb:UpdateItem"

        ]
        Resource = var.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:ListTables"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "s3_access" {
  name   = "${var.app_name}-s3-access"
  role   = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject"
      ]
      Resource = "${var.backend_artifacts_bucket_arn}/*"
    }]
  })
}

resource "aws_lambda_function" "express_app" {
  s3_bucket     = var.backend_artifacts_bucket_name
  s3_key        = var.lambda_zip_key  # e.g., "lambda-deployment.zip"
  function_name = "${var.app_name}-backend"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "lambda.handler"
  runtime       = "nodejs18.x"
  timeout       = 15

  # Add source_code_hash to detect S3 object changes
  source_code_hash = data.aws_s3_object.lambda_zip.etag

  environment {
    variables = {
      NODE_ENV       = "production"
      DYNAMODB_TABLE = "${var.app_name}-tasks-${var.stage}"  
      LOG_LEVEL      = "debug"
      CORS_ORIGIN    = var.cors_origin           
    }
  }
}

data "aws_s3_object" "lambda_zip" {
  bucket = var.backend_artifacts_bucket_name
  key    = var.lambda_zip_key
}

resource "aws_api_gateway_rest_api" "api" {
  name = "${var.app_name}-api"
}

resource "aws_api_gateway_rest_api_policy" "api_policy" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "execute-api:Invoke"
        Resource  = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.api.id}/*/*"
      }
    ]
  })
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.proxy.http_method
  integration_http_method = "POST"
  type        = "AWS_PROXY"
  uri         = aws_lambda_function.express_app.invoke_arn

  depends_on = [aws_api_gateway_method.proxy]
}

resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  # Ensure deployment happens after integration
  depends_on = [aws_api_gateway_integration.lambda]

  # Force redeployment on changes to resources, methods, or integrations
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy.id,
      aws_api_gateway_integration.lambda.id,
    ]))
  }
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.stage
  deployment_id = aws_api_gateway_deployment.deployment.id

  depends_on = [aws_api_gateway_deployment.deployment]
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.express_app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_dynamodb_table" "tasks" {
  name           = "${var.app_name}-tasks-${var.stage}"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.read_capacity
  write_capacity = var.write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Phase       = "4"
  }
}

resource "aws_dynamodb_table" "execution" {
  name         = "${var.project}-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }
  server_side_encryption {
    enabled = true
  }
  deletion_protection_enabled = var.deletion_protection_enabled
  tags                        = local.common_tags
}

data "aws_iam_policy_document" "execution_data" {
  statement {
    sid = "ExecutionTableOnly"
    actions = [
      "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem", "dynamodb:DeleteItem",
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query", "dynamodb:Scan",
      "dynamodb:UpdateItem", "dynamodb:DescribeTable"
    ]
    resources = [aws_dynamodb_table.execution.arn, "${aws_dynamodb_table.execution.arn}/index/*"]
  }
}

resource "aws_iam_policy" "execution_data" {
  name   = "${var.project}-${var.environment}-data"
  policy = data.aws_iam_policy_document.execution_data.json
  tags   = local.common_tags
}

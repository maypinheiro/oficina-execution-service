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
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
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

resource "aws_sqs_queue" "messages_dlq" {
  name                      = "${var.project}-${var.environment}-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
  tags                      = local.common_tags
}
resource "aws_sqs_queue" "messages" {
  name                       = "${var.project}-${var.environment}-commands"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
  sqs_managed_sse_enabled    = true
  redrive_policy             = jsonencode({ deadLetterTargetArn = aws_sqs_queue.messages_dlq.arn, maxReceiveCount = 5 })
  tags                       = local.common_tags
}
data "aws_iam_policy_document" "allow_domain_events" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.messages.arn]
    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [var.domain_events_topic_arn]
    }
  }
}
resource "aws_sqs_queue_policy" "allow_domain_events" {
  queue_url = aws_sqs_queue.messages.id
  policy    = data.aws_iam_policy_document.allow_domain_events.json
}
resource "aws_sns_topic_subscription" "domain_events" {
  topic_arn            = var.domain_events_topic_arn
  protocol             = "sqs"
  endpoint             = aws_sqs_queue.messages.arn
  raw_message_delivery = true
}

output "execution_table_name" { value = aws_dynamodb_table.execution.name }
output "execution_table_arn" { value = aws_dynamodb_table.execution.arn }
output "execution_data_policy_arn" { value = aws_iam_policy.execution_data.arn }

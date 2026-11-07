variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "environment" {
  type    = string
  default = "hml"
}
variable "project" {
  type    = string
  default = "oficina-execution"
}
variable "deletion_protection_enabled" {
  type        = bool
  description = "Protege a tabela contra exclusão acidental em ambientes persistentes."
  default     = false
}

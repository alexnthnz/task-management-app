variable "app_name" {
  description = "Application name"
  type        = string
}

variable "stage" {
  description = "Deployment stage (dev/prod)"
  type        = string
}

variable "read_capacity" {
  description = "Read capacity units"
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "Write capacity units"
  type        = number
  default     = 5
}
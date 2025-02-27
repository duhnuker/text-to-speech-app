provider "aws" {
  region = "ap-southeast-2"
}

# S3 Bucket for storing audio
resource "aws_s3_bucket" "tts_audio_bucket" {
  bucket = "dinuka-tts-audio-bucket"
  provider = aws
  force_destroy = true
}

resource "aws_s3_bucket_ownership_controls" "tts_audio_bucket" {
  bucket = aws_s3_bucket.tts_audio_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}


# IAM Role for Text-to-Speech Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "lambda-execution-role-tts"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_polly_access" {
  name = "LambdaPollyAccess"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "polly:SynthesizeSpeech"
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_invoke_policy" {
  name = "LambdaInvokePolicy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "lambda:InvokeFunction"
      Resource = aws_lambda_function.s3_upload.arn
    }]
  })
}


# CloudWatch logging policy for Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM Role for S3 Upload Lambda
resource "aws_iam_role" "s3_upload_role" {
  name = "s3-upload-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "s3_write_access" {
  name = "S3WriteAccess"
  role = aws_iam_role.s3_upload_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject"]
      Resource = "${aws_s3_bucket.tts_audio_bucket.arn}/*"
    }]
  })
}

# Lambda Function for S3 Upload
resource "aws_lambda_function" "s3_upload" {
  function_name    = "S3UploadLambda"
  role            = aws_iam_role.s3_upload_role.arn
  handler         = "s3_upload.lambda_handler"
  runtime         = "python3.9"
  filename        = "s3_upload.zip"
  source_code_hash = filebase64sha256("s3_upload.zip")
  timeout         = 10
  memory_size     = 128
}

# Lambda Function for Text-to-Speech
resource "aws_lambda_function" "text_to_speech" {
  function_name    = "TextToSpeechLambda"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = "python3.9"
  filename        = "lambda_function.zip"
  source_code_hash = filebase64sha256("lambda_function.zip")
  timeout         = 10
  memory_size     = 128
}

# API Gateway
resource "aws_api_gateway_rest_api" "tts_api" {
  name = "tts-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "tts_resource" {
  rest_api_id = aws_api_gateway_rest_api.tts_api.id
  parent_id   = aws_api_gateway_rest_api.tts_api.root_resource_id
  path_part   = "tts"
}

resource "aws_api_gateway_method" "tts_method" {
  rest_api_id   = aws_api_gateway_rest_api.tts_api.id
  resource_id   = aws_api_gateway_resource.tts_resource.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.tts_api.id
  resource_id = aws_api_gateway_resource.tts_resource.id
  http_method = aws_api_gateway_method.tts_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.text_to_speech.invoke_arn
}

resource "aws_api_gateway_deployment" "tts_deployment" {
  rest_api_id = aws_api_gateway_rest_api.tts_api.id
  depends_on  = [aws_api_gateway_integration.lambda]
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.tts_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.tts_api.id
  stage_name    = "prod"
}

# API KEY
resource "aws_api_gateway_api_key" "tts_api_key" {
  name = "tts-api-key"
}

resource "aws_api_gateway_usage_plan" "tts_usage_plan" {
  name = "tts-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.tts_api.id
    stage  = aws_api_gateway_stage.prod.stage_name
  }
}

resource "aws_api_gateway_usage_plan_key" "tts_usage_plan_key" {
  key_id        = aws_api_gateway_api_key.tts_api_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.tts_usage_plan.id
}

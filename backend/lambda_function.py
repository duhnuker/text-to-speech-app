import boto3
import json
import base64
import uuid

def lambda_handler(event, context):
    try:
        text = event.get('text', 'Hello, this is a test.')
        polly = boto3.client('polly')
        lambda_client = boto3.client('lambda')

        # Get audio from Polly
        response = polly.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId='Joanna'
        )

        audio_stream = response['AudioStream'].read()
        audio_base64 = base64.b64encode(audio_stream).decode('utf-8')

        # Generate unique filename
        filename = f"speech_{uuid.uuid4()}"

        # Invoke S3 upload Lambda
        s3_upload_response = lambda_client.invoke(
            FunctionName='S3UploadLambda',
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'audio': audio_base64,
                'filename': filename
            })
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                "audio": audio_base64,
                "filename": filename
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({"error": str(e)})
        }

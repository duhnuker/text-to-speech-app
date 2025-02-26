import boto3
import json
import base64

s3 = boto3.client('s3', region_name="ap-southeast-2")
BUCKET_NAME = "dinuka-tts-audio-bucket"

def lambda_handler(event, context):
    audio_data = base64.b64decode(event['audio'])
    file_name = f"{event['filename']}.mp3"
    
    s3.put_object(Bucket=BUCKET_NAME, Key=file_name, Body=audio_data, ContentType='audio/mpeg')

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "File uploaded successfully!", "file_url": f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_name}"})
    }

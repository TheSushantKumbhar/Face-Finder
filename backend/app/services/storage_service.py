import boto3
import os
from dotenv import load_dotenv
import io

load_dotenv()

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
)

BUCKET = os.getenv("R2_BUCKET_NAME")


def upload_file(file_content, filename: str, content_type: str):
    file_obj = io.BytesIO(file_content)
    s3.upload_fileobj(
        file_obj,
        BUCKET,
        filename,
        ExtraArgs={"ContentType": content_type}
    )

    return f"{os.getenv('R2_ENDPOINT')}/{BUCKET}/{filename}"
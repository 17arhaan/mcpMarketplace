import boto3
from botocore.config import Config
from api.config import settings

BUCKET = "mcp-tools"
_client = None


def get_s3():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.supabase_s3_endpoint,
            aws_access_key_id=settings.supabase_s3_access_key,
            aws_secret_access_key=settings.supabase_s3_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
        try:
            _client.head_bucket(Bucket=BUCKET)
        except Exception:
            _client.create_bucket(Bucket=BUCKET)
    return _client


def upload_tarball(key: str, data: bytes) -> None:
    get_s3().put_object(Bucket=BUCKET, Key=key, Body=data)


def presigned_download_url(key: str, expires: int = 3600) -> str:
    return get_s3().generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=expires,
    )


def download_to_dir(key: str, dest_path: str) -> None:
    get_s3().download_file(BUCKET, key, dest_path)

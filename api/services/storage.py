import os
import tempfile
from supabase import create_client, Client
from api.config import settings

BUCKET = "mcp-tools"
_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        # Ensure bucket exists
        try:
            buckets = [b.name for b in _client.storage.list_buckets()]
            if BUCKET not in buckets:
                _client.storage.create_bucket(BUCKET, options={"public": False})
        except Exception:
            pass
    return _client


def upload_tarball(key: str, data: bytes) -> None:
    sb = get_supabase()
    try:
        sb.storage.from_(BUCKET).remove([key])
    except Exception:
        pass
    sb.storage.from_(BUCKET).upload(key, data, {"content-type": "application/gzip"})


def presigned_download_url(key: str, expires: int = 3600) -> str:
    sb = get_supabase()
    res = sb.storage.from_(BUCKET).create_signed_url(key, expires)
    return res.get("signedURL", "")


def download_to_dir(key: str, dest_path: str) -> None:
    sb = get_supabase()
    data = sb.storage.from_(BUCKET).download(key)
    with open(dest_path, "wb") as f:
        f.write(data)

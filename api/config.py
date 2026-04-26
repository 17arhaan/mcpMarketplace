from pathlib import Path

from pydantic_settings import BaseSettings

# Always load from api/.env regardless of working directory
_ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    database_url: str = "postgresql://mcp:mcp@localhost:5432/mcp"
    redis_url: str = "redis://localhost:6379"
    jwt_secret: str = "changeme-32-byte-secret-here-dev"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    docker_host: str = "unix:///var/run/docker.sock"
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_service_role_key: str = ""
    supabase_s3_endpoint: str = ""
    supabase_s3_access_key: str = ""
    supabase_s3_secret_key: str = ""

    class Config:
        env_file = str(_ENV_FILE)


settings = Settings()

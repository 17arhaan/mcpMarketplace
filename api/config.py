from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://mcp:mcp@localhost:5432/mcp"
    redis_url: str = "redis://localhost:6379"
    s3_bucket: str = "mcp-tools-dev"
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    jwt_secret: str = "changeme-32-byte-secret-here-dev"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    docker_host: str = "unix:///var/run/docker.sock"
    supabase_jwt_secret: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

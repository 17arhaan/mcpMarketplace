from pydantic_settings import BaseSettings


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

    class Config:
        env_file = ".env"


settings = Settings()

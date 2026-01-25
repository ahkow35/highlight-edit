"""Application configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False

    # Beta Access
    beta_invite_code: str = "I-LOVE-NYAN-CAT"

    # Security
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Storage
    storage_provider: str = "local"  # "local" or "s3"
    s3_bucket_name: str = ""
    s3_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # File retention (hours)
    file_retention_hours: int = 24

    # Adobe PDF Services
    adobe_client_id: str = ""
    adobe_client_secret: str = ""

    class Config:
        # Load .env from project root (../../.env relative to this file)
        import os
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
        env_file_encoding = "utf-8"


settings = Settings()

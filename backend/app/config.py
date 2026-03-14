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
    access_token_expire_minutes: int = 10080  # 7 days

    # Storage
    storage_provider: str = "local"  # "local" or "s3"
    s3_bucket_name: str = ""
    s3_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # File retention (hours)
    file_retention_hours: int = 24

    # CORS
    allowed_origins: str = "http://localhost:5173"

    # Adobe PDF Services
    adobe_client_id: str = ""
    adobe_client_secret: str = ""

    # Admin seed (used by scripts/seed_admin.py only)
    admin_email: str = ""  # Email of the initial admin user (used for seeding only)

    # Email (SMTP)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    app_base_url: str = "http://localhost:5173"

    class Config:
        # Load .env from project root (../../.env relative to this file)
        import os
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
        env_file_encoding = "utf-8"


settings = Settings()

"""
Application settings loaded from environment variables.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # JWT secret key for token signing (REQUIRED - no default for security)
    SECRET_KEY: str

    # Data directory for databases, media, and config
    DATA_DIR: str = "./data"
    
    # Base directory (Project Root / Backend Root)
    # We default to "." (current working dir) which is usually 'backend/' when running uvicorn
    BASE_DIR: str = "."

    # CORS - Frontend URL for cookie sharing
    FRONTEND_URL: str = "http://localhost:3000"

    # Server
    DEBUG: bool = False

    # Auth settings
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    # Argon2id parameters (OWASP 2025 recommendations for interactive login)
    ARGON2_MEMORY_COST: int = 65536  # 64 MiB
    ARGON2_TIME_COST: int = 3  # iterations
    ARGON2_PARALLELISM: int = 1

    # Rate limiting
    RATE_LIMIT_LOGIN: str = "5/minute"

    # Password reset flag (set to True to reset password on restart)
    RESET_PASSWORD: bool = False


settings = Settings()

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

    # Auth - Argon2id hashed password
    # Generate with: python -c "from argon2 import PasswordHasher; print(PasswordHasher().hash('yourpassword'))"
    LOCUS_PASSWORD_HASH: str = "$argon2id$v=19$m=65536,t=3,p=4$changeme"
    SECRET_KEY: str = "super-secret-key-change-in-production"

    # Database
    DATABASE_PATH: str = "./data/locus.db"

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


settings = Settings()

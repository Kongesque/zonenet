"""
Locus Backend - FastAPI Application Entry Point
"""
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.auth import hash_password
from app.core.config import settings
from app.db.auth import (
    clear_password_hash,
    init_auth_db,
    is_setup_complete,
    set_password_hash,
)
from app.db.database import init_db
from app.routers import auth, health, video

# Rate limiter instance
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs on startup and shutdown.
    """
    # Startup: Ensure data directory exists
    data_dir = Path(settings.DATA_DIR)
    data_dir.mkdir(parents=True, exist_ok=True)

    # Initialize databases
    await init_db()
    await init_auth_db()

    # Handle password reset flag
    if settings.RESET_PASSWORD:
        await clear_password_hash()
        # Generate a random password and print to logs
        new_password = secrets.token_urlsafe(16)
        new_hash = hash_password(new_password)
        await set_password_hash(new_hash)
        print("=" * 60)
        print("PASSWORD RESET")
        print(f"New password: {new_password}")
        print("Please change RESET_PASSWORD back to False in your .env")
        print("=" * 60)

    # Log setup status
    if await is_setup_complete():
        print("Auth: Setup complete, login required")
    else:
        print("Auth: Setup required, visit /setup to create password")

    yield

    # Shutdown: cleanup if needed
    pass


app = FastAPI(
    title="Locus API",
    description="Self-hosted computer vision platform backend",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Attach rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(video.router, prefix="/api/video", tags=["video"])


@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "name": "Locus API",
        "version": "0.1.0",
        "docs": "/docs" if settings.DEBUG else None,
    }

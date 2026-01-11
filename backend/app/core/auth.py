"""
Simple single-password authentication with JWT cookies and Argon2id hashing.
"""
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import HTTPException, Request, status

from app.core.config import settings
from app.db.auth import get_password_hash

# Initialize Argon2id hasher with OWASP 2025 parameters
_hasher = PasswordHasher(
    memory_cost=settings.ARGON2_MEMORY_COST,
    time_cost=settings.ARGON2_TIME_COST,
    parallelism=settings.ARGON2_PARALLELISM,
)


async def verify_password(input_password: str) -> bool:
    """
    Check if the provided password matches the stored hash.
    Uses Argon2id for secure password verification.
    """
    stored_hash = await get_password_hash()
    if not stored_hash:
        return False
    
    try:
        _hasher.verify(stored_hash, input_password)
        return True
    except VerifyMismatchError:
        return False


def hash_password(password: str) -> str:
    """
    Hash a password using Argon2id.
    Used for generating the initial password hash.
    """
    return _hasher.hash(password)


def create_access_token() -> str:
    """Create a JWT access token with expiration and security claims."""
    now = datetime.now(UTC)
    expire = now + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "exp": expire,
        "iat": now,                        # Issued at
        "jti": secrets.token_hex(16),      # Unique token ID
        "iss": "locus",                    # Issuer
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def verify_token(token: str) -> bool:
    """Verify a JWT token is valid, not expired, and from Locus."""
    try:
        jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["exp", "iat", "jti", "iss"]},
            issuer="locus",
        )
        return True
    except jwt.PyJWTError:
        return False


async def get_current_user(request: Request) -> dict:
    """
    Dependency to verify the user is authenticated via cookie.
    Raises 401 if not authenticated.
    """
    token = request.cookies.get("locus_auth")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    if not verify_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return {"authenticated": True}

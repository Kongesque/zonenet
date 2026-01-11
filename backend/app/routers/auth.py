"""
Authentication routes - login, logout, and auth status.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import (
    create_access_token,
    get_current_user,
    verify_password,
)
from app.core.config import settings
from app.schemas.auth import (
    AuthStatusResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
)

router = APIRouter()

# Rate limiter for login endpoint
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=LoginResponse)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(request: Request, data: LoginRequest, response: Response) -> LoginResponse:
    """
    Authenticate with the single password.
    Sets an HTTP-only cookie on success.
    Rate limited to prevent brute force attacks.
    """
    if not verify_password(data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )

    token = create_access_token()

    # Set HTTP-only cookie for security
    response.set_cookie(
        key="locus_auth",
        value=token,
        httponly=True,
        secure=not settings.DEBUG,  # Secure in production (HTTPS)
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_HOURS * 3600,
    )

    return LoginResponse(success=True)


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    _user: dict = Depends(get_current_user),
) -> LogoutResponse:
    """
    Log out by clearing the auth cookie.
    """
    response.delete_cookie("locus_auth")
    return LogoutResponse(success=True)


@router.get("/me", response_model=AuthStatusResponse)
async def me(user: dict = Depends(get_current_user)) -> AuthStatusResponse:
    """
    Check if the current request is authenticated.
    """
    return AuthStatusResponse(authenticated=user["authenticated"])

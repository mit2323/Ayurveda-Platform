"""Auth API routes — /api/v1/auth/*"""
from fastapi import APIRouter, Depends, status

from app.core.dependencies import CurrentUser, DBSession
from app.repositories.user import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleOAuthRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
    TokenRefreshResponse,
    UserPublic,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_service(db: DBSession) -> AuthService:
    return AuthService(UserRepository(db))


@router.post(
    "/register",
    response_model=TokenPair,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
async def register(data: RegisterRequest, db: DBSession):
    return await _get_service(db).register(data)


@router.post("/login", response_model=TokenPair, summary="Login with email and password")
async def login(data: LoginRequest, db: DBSession):
    return await _get_service(db).login(data)


@router.post("/refresh", response_model=TokenRefreshResponse, summary="Refresh access token")
async def refresh_token(data: RefreshTokenRequest, db: DBSession):
    return await _get_service(db).refresh_access_token(data.refresh_token)


@router.post("/google", response_model=TokenPair, summary="Login / register with Google OAuth")
async def google_oauth(data: GoogleOAuthRequest, db: DBSession):
    return await _get_service(db).google_oauth(data)


@router.get("/me", response_model=UserPublic, summary="Get current user profile")
async def get_me(current_user: CurrentUser):
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(data: ForgotPasswordRequest, db: DBSession):
    # Intentionally vague response to prevent email enumeration
    # TODO: trigger Celery task to send reset email
    return {"message": "If that email is registered, you will receive a reset link"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPasswordRequest, db: DBSession):
    # TODO: implement password reset with token verification
    return {"message": "Password reset successfully"}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    # JWT is stateless — frontend deletes the token
    # For refresh token invalidation: store token jti in Redis blocklist
    return {"message": "Logged out successfully"}
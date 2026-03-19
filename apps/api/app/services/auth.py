"""
Auth service — business logic for registration, login, token management.
Services coordinate repositories, never touch SQLAlchemy directly.
"""
from fastapi import HTTPException, status

from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import OAuthProvider, User, UserRole
from app.repositories.user import UserRepository
from app.schemas.auth import (
    GoogleOAuthRequest,
    LoginRequest,
    RegisterRequest,
    TokenPair,
    TokenRefreshResponse,
    UserPublic,
)
from app.utils.slug import slugify


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def register(self, data: RegisterRequest) -> TokenPair:
        # Check email uniqueness
        if await self.user_repo.email_exists(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        user = await self.user_repo.create(
            email=data.email.lower(),
            full_name=data.full_name,
            phone=data.phone,
            password_hash=hash_password(data.password),
            role=UserRole.CUSTOMER,
            oauth_provider=OAuthProvider.LOCAL,
            is_active=True,
            is_verified=False,
        )
        await self.user_repo.save()

        # TODO: send verification email via Celery task
        # send_verification_email.delay(user.id)

        return self._build_token_pair(user)

    async def login(self, data: LoginRequest) -> TokenPair:
        user = await self.user_repo.get_by_email(data.email)

        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated",
            )

        return self._build_token_pair(user)

    async def refresh_access_token(self, refresh_token: str) -> TokenRefreshResponse:
        from jose import JWTError
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        user = await self.user_repo.get_by_id(int(payload["sub"]))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return TokenRefreshResponse(
            access_token=create_access_token(user.id, user.role.value)
        )

    async def google_oauth(self, data: GoogleOAuthRequest) -> TokenPair:
        """
        Verify Google ID token and upsert the user.
        In production use google-auth library to verify the token.
        """
        # Placeholder — integrate google-auth to verify data.id_token
        # payload = id_token.verify_oauth2_token(data.id_token, requests.Request(), settings.GOOGLE_CLIENT_ID)
        raise HTTPException(status_code=501, detail="Google OAuth not yet configured")

    def _build_token_pair(self, user: User) -> TokenPair:
        return TokenPair(
            access_token=create_access_token(user.id, user.role.value),
            refresh_token=create_refresh_token(user.id),
            user=UserPublic.model_validate(user),
        )
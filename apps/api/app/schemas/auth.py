"""Auth request/response schemas."""
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole
from app.schemas.base import OrmBase


# ── Request schemas ───────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    phone: str | None = Field(None, min_length=7, max_length=15)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class GoogleOAuthRequest(BaseModel):
    id_token: str  # Google ID token from frontend


# ── Response schemas ──────────────────────────────────────────────────────────
class UserPublic(OrmBase):
    """Safe user data to return — never expose password_hash."""
    id: int
    email: str
    full_name: str
    phone: str | None
    role: UserRole
    is_verified: bool
    avatar_url: str | None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserPublic


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
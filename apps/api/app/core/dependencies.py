"""
Reusable FastAPI dependencies for dependency injection.
"""
from typing import Annotated, AsyncGenerator

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.repositories.user import UserRepository

# ── Database session ──────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield an async DB session per request, close it after.
    SQLAlchemy handles commit/rollback within the session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


DBSession = Annotated[AsyncSession, Depends(get_db)]

# ── Redis connection ──────────────────────────────────────────────────────────
_redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Return a shared async Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_pool


RedisClient = Annotated[aioredis.Redis, Depends(get_redis)]

# ── Auth bearer scheme ────────────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    db: DBSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    """
    Decode JWT, fetch the user from DB.
    Raises 401 if token is missing/invalid or user is inactive.
    """
    if credentials is None:
        raise CREDENTIALS_EXCEPTION

    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise CREDENTIALS_EXCEPTION

    if payload.get("type") != "access":
        raise CREDENTIALS_EXCEPTION

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise CREDENTIALS_EXCEPTION

    repo = UserRepository(db)
    user = await repo.get_by_id(int(user_id))
    if user is None or not user.is_active:
        raise CREDENTIALS_EXCEPTION

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_active_user(current_user: CurrentUser) -> User:
    """Require an active user (alias for current user guard)."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def require_admin(current_user: CurrentUser) -> User:
    """Require the current user to have admin or superadmin role."""
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


AdminUser = Annotated[User, Depends(require_admin)]

# ── Pagination ────────────────────────────────────────────────────────────────
class PaginationParams:
    def __init__(self, page: int = 1, page_size: int = 20) -> None:
        if page < 1:
            raise HTTPException(status_code=422, detail="page must be >= 1")
        if not (1 <= page_size <= 100):
            raise HTTPException(status_code=422, detail="page_size must be 1-100")
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size


Pagination = Annotated[PaginationParams, Depends(PaginationParams)]
"""
Async SQLAlchemy engine and session factory.
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

# NullPool is recommended for serverless/edge environments (Neon, Supabase)
# Use QueuePool for long-running servers (Render, Railway)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    # pool_class=NullPool,   # uncomment for serverless
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # prevent lazy-load errors after commit
    autocommit=False,
    autoflush=False,
)
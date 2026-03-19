from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings
import ssl

# Build connect_args for SSL (required for Neon, Supabase etc.)
connect_args = {}
if "neon.tech" in settings.DATABASE_URL or "supabase" in settings.DATABASE_URL:
    ssl_context = ssl.create_default_context()
    connect_args["ssl"] = ssl_context

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

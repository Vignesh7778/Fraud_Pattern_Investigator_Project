import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

# Primary PostgreSQL / Supabase Async Engine
database_url = settings.DATABASE_URL

# Fallback SQLite DB path if PostgreSQL is offline
sqlite_fallback_url = "sqlite+aiosqlite:///./data/fraud_investigator.db"

try:
    engine = create_async_engine(
        database_url,
        echo=False,
        future=True,
        pool_pre_ping=True
    )
except Exception as e:
    logger.warning("postgres_engine_init_fallback", error=str(e))
    engine = create_async_engine(
        sqlite_fallback_url,
        echo=False,
        future=True
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

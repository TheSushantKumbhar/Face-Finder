import os 
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL

engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # use for logging queries
    pool_pre_ping=True,
    connect_args={
        "prepared_statement_cache_size": 0,  # prevents stale cache errors after schema changes
    },
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


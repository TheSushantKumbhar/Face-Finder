import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

import os
from dotenv import load_dotenv
from app.models.user import User

# ✅ Load environment variables
load_dotenv()

# Alembic Config object
config = context.config

# ✅ Override DB URL from .env
config.set_main_option(
    "sqlalchemy.url",
    os.getenv("DATABASE_URL")
)

# Setup logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ✅ Import your Base and models
from app.db.base import Base
from app.models.user import User  # 👈 IMPORTANT (add more models here later)

# Target metadata for autogenerate
target_metadata = Base.metadata


# ----------------------------
# OFFLINE MIGRATIONS
# ----------------------------
def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    
    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ----------------------------
# SYNC WRAPPER
# ----------------------------
def do_run_migrations(connection: Connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )

    with context.begin_transaction():
        context.run_migrations()


# ----------------------------
# ONLINE (ASYNC) MIGRATIONS
# ----------------------------
async def run_migrations_online():
    """Run migrations in 'online' mode with async engine."""

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


# ----------------------------
# ENTRY POINT
# ----------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
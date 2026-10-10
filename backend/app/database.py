"""
WeCare.AI Database Module

SQLAlchemy 2.x async engine and session management for SQLite.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config import settings


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


# Create engine with SQLite-specific configuration
engine = create_engine(
    settings.database_url,
    echo=settings.database_echo,
    poolclass=StaticPool,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,
    },
)


# Enable foreign key constraints for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign keys for SQLite connections."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=Session,
)


def init_db() -> None:
    """Initialize database tables. Safe to call multiple times."""
    # Import models to register them
    from app.models import patient, assessment, events  # noqa: F401
    Base.metadata.create_all(bind=engine)
    # Lightweight SQLite migration for installations created before names were
    # stored with patient records. New databases receive these columns via ORM.
    if engine.dialect.name == "sqlite":
        existing_columns = {column["name"] for column in inspect(engine).get_columns("patients")}
        with engine.begin() as connection:
            if "name" not in existing_columns:
                connection.execute(text("ALTER TABLE patients ADD COLUMN name VARCHAR(200)"))
            if "gender" not in existing_columns:
                connection.execute(text("ALTER TABLE patients ADD COLUMN gender VARCHAR(50)"))


def get_db() -> Session:
    """Get a database session. Use with dependency injection."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[Session, None]:
    """Async context manager for database session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

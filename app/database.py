import logging
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()


def _create_engine() -> Engine | None:
    """Create the SQLAlchemy engine when DATABASE_URL is configured."""

    database_url = settings.database_url
    if not database_url:
        logger.warning("DATABASE_URL is not configured; database engine not initialized.")
        return None

    try:
        return create_engine(database_url, pool_pre_ping=True)
    except Exception:
        logger.warning("DATABASE_URL is invalid; database engine not initialized.")
        return None


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session per request."""

    if engine is None:
        raise RuntimeError("Database is not configured.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """Return True when the database accepts a simple SELECT 1 query."""

    if engine is None:
        return False

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        logger.warning("Database connection check failed.")
        return False
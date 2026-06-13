import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.logging_config import configure_logging


configure_logging()

from app.api.admin_articles import router as admin_articles_router
from app.api.admin_discovery import router as admin_discovery_router
from app.api.admin_journals import router as admin_journals_router
from app.api.admin_llm_runs import router as admin_llm_runs_router
from app.api.admin_manual import router as admin_manual_router
from app.api.admin_review import router as admin_review_router
from app.api.health import router as health_router
from app.api.internal_jobs import router as internal_jobs_router


settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting %s in %s environment", settings.APP_NAME, settings.APP_ENV)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)
app.include_router(health_router)
app.include_router(admin_journals_router)
app.include_router(admin_articles_router)
app.include_router(admin_review_router)
app.include_router(internal_jobs_router)
app.include_router(admin_llm_runs_router)
app.include_router(admin_manual_router)
app.include_router(admin_discovery_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Science Admin Backend is running"}

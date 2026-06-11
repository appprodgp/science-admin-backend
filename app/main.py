import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.logging_config import configure_logging


configure_logging()

from app.api.health import router as health_router


settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting %s in %s environment", settings.APP_NAME, settings.APP_ENV)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)
app.include_router(health_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Science Admin Backend is running"}

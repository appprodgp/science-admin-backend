from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.article import Article
from app.services.article_ingestion_service import discover_articles_for_active_journals


router = APIRouter(prefix="/api/admin/discovery", tags=["admin discovery"])

DbSession = Annotated[Session, Depends(get_db)]

SUMMARY_STATUSES = (
    "metadata_found",
    "license_rejected",
    "xml_not_found",
    "xml_ready",
    "extracted",
    "failed",
)


class DiscoveryRunRequest(BaseModel):
    limit_per_journal: int | None = Field(default=None, ge=1)


@router.post("/run")
def run_discovery(
    db: DbSession,
    payload: DiscoveryRunRequest | None = Body(default=None),
) -> dict[str, int]:
    return discover_articles_for_active_journals(
        db,
        limit_per_journal=payload.limit_per_journal if payload else None,
    )


@router.get("/summary")
def discovery_summary(db: DbSession) -> dict[str, int]:
    counts = {status: 0 for status in SUMMARY_STATUSES}
    rows = db.execute(
        select(Article.status, func.count(Article.id))
        .where(Article.status.in_(SUMMARY_STATUSES))
        .group_by(Article.status)
    ).all()
    for status, count in rows:
        counts[str(status)] = int(count)
    return counts
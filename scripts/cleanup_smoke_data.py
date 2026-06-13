from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import delete, func, or_, select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.database import SessionLocal, engine
from app.models.article import Article
from app.models.job import PipelineJob
from app.models.journal import Journal


JOURNAL_NAME_PREFIXES = (
    "Step 2 Smoke",
    "Step 2 Uvicorn Smoke",
)

ARTICLE_DOI_PREFIXES = (
    "10.1234/step2-smoke",
    "10.1234/uvicorn-smoke",
)

JOB_MARKERS = (
    "test",
    "smoke",
)


def _journal_filter():
    return or_(*(Journal.name.startswith(prefix) for prefix in JOURNAL_NAME_PREFIXES))


def _article_filter():
    return or_(*(Article.doi.startswith(prefix) for prefix in ARTICLE_DOI_PREFIXES))


def _pipeline_job_filter():
    job_type = func.lower(PipelineJob.job_type)
    message = func.lower(func.coalesce(PipelineJob.message, ""))

    return or_(
        *(job_type.contains(marker) for marker in JOB_MARKERS),
        *(message.contains(marker) for marker in JOB_MARKERS),
    )


def cleanup_smoke_data() -> None:
    """Delete only records created by Step 2 smoke tests.

    This script is intentionally conservative for journals and articles:
    it only deletes exact Step 2 smoke-test prefixes and will not match the
    seeded real journal whitelist.
    """

    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured; cannot clean smoke data.")

    with SessionLocal() as db:
        journal_ids = list(db.scalars(select(Journal.id).where(_journal_filter())).all())
        article_ids = list(db.scalars(select(Article.id).where(_article_filter())).all())
        pipeline_job_ids = list(db.scalars(select(PipelineJob.id).where(_pipeline_job_filter())).all())

        if article_ids:
            db.execute(delete(Article).where(Article.id.in_(article_ids)))
        if journal_ids:
            db.execute(delete(Journal).where(Journal.id.in_(journal_ids)))
        if pipeline_job_ids:
            db.execute(delete(PipelineJob).where(PipelineJob.id.in_(pipeline_job_ids)))

        db.commit()

    print("Step 2 smoke-data cleanup complete.")
    print(f"journals_deleted={len(journal_ids)}")
    print(f"articles_deleted={len(article_ids)}")
    print(f"pipeline_jobs_deleted={len(pipeline_job_ids)}")


if __name__ == "__main__":
    cleanup_smoke_data()
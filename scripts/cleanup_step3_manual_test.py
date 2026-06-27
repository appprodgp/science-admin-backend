from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import delete, select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.database import SessionLocal, engine
from app.models.article import Article


MANUAL_TEST_DOI = "10.9999/manual-test-001"


def cleanup_step3_manual_test() -> None:
    """Delete only the Step 3 manual ingestion test article.

    Related article_sections and article_figures are removed by the existing
    database/ORM cascade configured on the Article relationships. No real
    extracted articles are matched because this script uses one exact DOI.
    """

    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured; cannot clean Step 3 manual test data.")

    with SessionLocal() as db:
        article_ids = list(
            db.scalars(select(Article.id).where(Article.doi == MANUAL_TEST_DOI)).all()
        )
        if article_ids:
            db.execute(delete(Article).where(Article.id.in_(article_ids)))
        db.commit()

    print("Step 3 manual-test cleanup complete.")
    print(f"articles_deleted={len(article_ids)}")


if __name__ == "__main__":
    cleanup_step3_manual_test()
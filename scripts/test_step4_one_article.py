from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import select


RUN_GENERATION = False

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.database import SessionLocal, engine
from app.models.article import Article
from app.services.article_generation_service import generate_article_for_review
from app.services.curation_service import curate_article
from app.services.fact_check_service import fact_check_generated_article


def main() -> None:
    if engine is None:
        raise SystemExit("DATABASE_URL is not configured; cannot run Step 4 article test.")

    with SessionLocal() as db:
        article = db.scalar(
            select(Article).where(Article.status == "extracted").order_by(Article.created_at.asc()).limit(1)
        )
        if article is None:
            print('No article with status="extracted" was found.')
            return

        print("Selected extracted article:")
        print(f"- Title: {article.title}")
        print(f"- DOI: {article.doi}")

        curation = curate_article(db, article.id)
        print("\nCuration output:")
        print(
            json.dumps(
                {
                    "id": str(curation.id),
                    "article_id": str(curation.article_id),
                    "public_interest": curation.public_interest,
                    "novelty": curation.novelty,
                    "evidence_strength": curation.evidence_strength,
                    "human_relevance": curation.human_relevance,
                    "story_potential": curation.story_potential,
                    "overhype_risk": curation.overhype_risk,
                    "selected": curation.selected,
                    "reason": curation.reason,
                    "model": curation.model,
                },
                indent=2,
            )
        )

        if not RUN_GENERATION:
            print("\nRUN_GENERATION is False; stopping after curation.")
            return

        if not curation.selected:
            print("\nArticle was not selected; generation skipped.")
            return

        generated = generate_article_for_review(db, article.id)
        print("\nGenerated draft:")
        print(json.dumps({"id": str(generated.id), "review_status": generated.review_status}, indent=2))

        checked = fact_check_generated_article(db, generated.id)
        print("\nFact-check result:")
        print(
            json.dumps(
                {
                    "id": str(checked.id),
                    "review_status": checked.review_status,
                    "fact_check_json": checked.fact_check_json,
                },
                indent=2,
            )
        )


if __name__ == "__main__":
    main()

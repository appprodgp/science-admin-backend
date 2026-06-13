from __future__ import annotations

import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import select


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.database import SessionLocal, engine
from app.main import app
from app.models.generated_article import GeneratedArticle


def main() -> None:
    if engine is None:
        raise SystemExit("DATABASE_URL is not configured; cannot run generated endpoint smoke test.")

    with SessionLocal() as db:
        generated_article = db.scalar(
            select(GeneratedArticle).order_by(GeneratedArticle.created_at.desc()).limit(1)
        )
        if generated_article is None:
            print("No generated articles found; nothing to smoke test.")
            return

        article_id = generated_article.article_id
        generated_article_id = generated_article.id

    client = TestClient(app)

    list_response = client.get(f"/api/admin/ai/generated/{article_id}")
    print(f"GET /api/admin/ai/generated/{article_id} -> {list_response.status_code}")
    list_response.raise_for_status()
    generated_items = list_response.json()
    if not isinstance(generated_items, list):
        raise AssertionError("Generated article list endpoint did not return a list")
    if not any(item.get("id") == str(generated_article_id) for item in generated_items):
        raise AssertionError("Generated article list endpoint did not include the expected item")

    item_response = client.get(f"/api/admin/ai/generated-item/{generated_article_id}")
    print(f"GET /api/admin/ai/generated-item/{generated_article_id} -> {item_response.status_code}")
    item_response.raise_for_status()
    generated_item = item_response.json()
    for key in ("id", "article_id", "review_status", "fact_check_json"):
        if key not in generated_item:
            raise AssertionError(f"Generated article item response is missing key: {key}")

    print(
        json.dumps(
            {
                "article_id": str(article_id),
                "generated_article_id": str(generated_article_id),
                "list_count": len(generated_items),
                "item_review_status": generated_item.get("review_status"),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

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
from app.models.article import Article
from app.models.generated_article import GeneratedArticle


PUBLIC_REVIEW_STATUSES = ("approved", "published")
PUBLIC_ARTICLE_STATUSES = ("approved", "published")
ADMIN_ONLY_KEYS = {
    "review_status",
    "fact_check_json",
    "generation_model",
    "article_id",
    "error_message",
    "priority_score",
    "xml_url",
    "xml_r2_key",
}


def _assert_no_admin_keys(payload: object, path: str = "payload") -> None:
    if isinstance(payload, dict):
        leaked = sorted(ADMIN_ONLY_KEYS.intersection(payload.keys()))
        if leaked:
            raise AssertionError(f"{path} leaked admin-only keys: {', '.join(leaked)}")
        for key, value in payload.items():
            _assert_no_admin_keys(value, f"{path}.{key}")
    elif isinstance(payload, list):
        for index, item in enumerate(payload):
            _assert_no_admin_keys(item, f"{path}[{index}]")


def _assert_response_has_keys(payload: dict, keys: tuple[str, ...], endpoint: str) -> None:
    for key in keys:
        if key not in payload:
            raise AssertionError(f"{endpoint} response is missing key: {key}")


def main() -> None:
    if engine is None:
        raise SystemExit("DATABASE_URL is not configured; cannot run public endpoint smoke test.")

    with SessionLocal() as db:
        generated_article = db.scalar(
            select(GeneratedArticle)
            .join(Article, GeneratedArticle.article_id == Article.id)
            .where(
                GeneratedArticle.review_status.in_(PUBLIC_REVIEW_STATUSES),
                Article.status.in_(PUBLIC_ARTICLE_STATUSES),
            )
            .order_by(GeneratedArticle.published_at.desc().nullslast(), GeneratedArticle.updated_at.desc())
            .limit(1)
        )
        if generated_article is None:
            print("No approved/published generated articles found; public endpoint smoke test skipped.")
            return

        generated_article_id = generated_article.id

    client = TestClient(app)

    list_endpoint = "/api/public/articles?limit=100"
    list_response = client.get(list_endpoint)
    print(f"GET {list_endpoint} -> {list_response.status_code}")
    list_response.raise_for_status()
    list_payload = list_response.json()
    _assert_response_has_keys(list_payload, ("items", "limit", "offset", "total"), list_endpoint)
    if not isinstance(list_payload["items"], list):
        raise AssertionError("Public articles list endpoint did not return an items list")
    if not any(item.get("id") == str(generated_article_id) for item in list_payload["items"]):
        raise AssertionError("Public articles list endpoint did not include the selected public article")
    _assert_no_admin_keys(list_payload)

    detail_endpoint = f"/api/public/articles/{generated_article_id}"
    detail_response = client.get(detail_endpoint)
    print(f"GET {detail_endpoint} -> {detail_response.status_code}")
    detail_response.raise_for_status()
    detail_payload = detail_response.json()
    _assert_response_has_keys(
        detail_payload,
        (
            "id",
            "title",
            "subtitle",
            "summary",
            "source",
            "body",
            "paragraphs",
            "glossary",
            "limitations",
        ),
        detail_endpoint,
    )
    _assert_no_admin_keys(detail_payload)

    quiz_endpoint = f"/api/public/articles/{generated_article_id}/quiz"
    quiz_response = client.get(quiz_endpoint)
    print(f"GET {quiz_endpoint} -> {quiz_response.status_code}")
    quiz_response.raise_for_status()
    quiz_payload = quiz_response.json()
    _assert_response_has_keys(quiz_payload, ("articleId", "title", "questions"), quiz_endpoint)
    if not isinstance(quiz_payload["questions"], list):
        raise AssertionError("Public article quiz endpoint did not return a questions list")
    _assert_no_admin_keys(quiz_payload)

    print(
        json.dumps(
            {
                "generated_article_id": str(generated_article_id),
                "list_count": len(list_payload["items"]),
                "total": list_payload["total"],
                "quiz_question_count": len(quiz_payload["questions"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

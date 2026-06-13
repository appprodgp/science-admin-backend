from __future__ import annotations

import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import select


RUN_MUTATION_TEST = False

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.database import SessionLocal, engine
from app.main import app
from app.models.generated_article import GeneratedArticle


def _assert_response_has_keys(payload: dict, keys: tuple[str, ...], endpoint: str) -> None:
    for key in keys:
        if key not in payload:
            raise AssertionError(f"{endpoint} response is missing key: {key}")


def main() -> None:
    if engine is None:
        raise SystemExit("DATABASE_URL is not configured; cannot run review workflow smoke test.")

    with SessionLocal() as db:
        generated_article = db.scalar(
            select(GeneratedArticle)
            .where(GeneratedArticle.review_status == "pending")
            .order_by(GeneratedArticle.created_at.desc())
            .limit(1)
        )
        if generated_article is None:
            print("No pending generated articles found; review workflow smoke test skipped.")
            return

        generated_article_id = generated_article.id

    client = TestClient(app)

    queue_response = client.get("/api/admin/review/queue")
    print(f"GET /api/admin/review/queue -> {queue_response.status_code}")
    queue_response.raise_for_status()
    queue_items = queue_response.json()
    if not isinstance(queue_items, list):
        raise AssertionError("Review queue endpoint did not return a list")
    if not any(item.get("generated_article_id") == str(generated_article_id) for item in queue_items):
        raise AssertionError("Review queue endpoint did not include the selected pending generated article")

    detail_endpoint = f"/api/admin/review/generated/{generated_article_id}"
    detail_response = client.get(detail_endpoint)
    print(f"GET {detail_endpoint} -> {detail_response.status_code}")
    detail_response.raise_for_status()
    detail = detail_response.json()
    _assert_response_has_keys(
        detail,
        (
            "id",
            "generated_article_id",
            "article_id",
            "plain_title",
            "subtitle",
            "article_body",
            "difficult_words_json",
            "mcqs_json",
            "limitations_json",
            "source_attribution",
            "fact_check_json",
            "review_status",
            "article",
            "curation_score",
        ),
        detail_endpoint,
    )

    events_endpoint = f"/api/admin/review/generated/{generated_article_id}/events"
    events_response = client.get(events_endpoint)
    print(f"GET {events_endpoint} -> {events_response.status_code}")
    events_response.raise_for_status()
    events = events_response.json()
    if not isinstance(events, list):
        raise AssertionError("Review events endpoint did not return a list")

    summary_response = client.get("/api/admin/review/queues/summary")
    print(f"GET /api/admin/review/queues/summary -> {summary_response.status_code}")
    summary_response.raise_for_status()
    summary = summary_response.json()
    _assert_response_has_keys(
        summary,
        ("pending", "needs_revision", "approved", "rejected"),
        "/api/admin/review/queues/summary",
    )

    mutation_test = "skipped"
    if RUN_MUTATION_TEST:
        if detail.get("plain_title"):
            patch_payload = {
                "plain_title": detail["plain_title"],
                "note": "Smoke review workflow PATCH test; content value intentionally unchanged.",
            }
            patch_response = client.patch(detail_endpoint, json=patch_payload)
            print(f"PATCH {detail_endpoint} -> {patch_response.status_code}")
            patch_response.raise_for_status()
            mutation_test = "patch_ok"
        else:
            mutation_test = "skipped_no_plain_title"
            print("RUN_MUTATION_TEST=True, but selected article has no plain_title; PATCH skipped.")

    print(
        json.dumps(
            {
                "generated_article_id": str(generated_article_id),
                "queue_count": len(queue_items),
                "review_status": detail.get("review_status"),
                "events_count": len(events),
                "summary": summary,
                "mutation_test": mutation_test,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

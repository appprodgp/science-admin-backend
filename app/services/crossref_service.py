
from __future__ import annotations

import logging
from datetime import date
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.config import get_settings


logger = logging.getLogger(__name__)

CROSSREF_WORKS_URL = "https://api.crossref.org/works"
DEFAULT_TIMEOUT = httpx.Timeout(20.0, connect=10.0)


def _first_string(value: Any) -> str | None:
    if isinstance(value, list):
        for item in value:
            if isinstance(item, str) and item.strip():
                return item.strip()
        return None
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _date_from_crossref_date(value: Any) -> date | None:
    if not isinstance(value, dict):
        return None

    date_parts = value.get("date-parts")
    if not isinstance(date_parts, list) or not date_parts:
        return None
    first_parts = date_parts[0]
    if not isinstance(first_parts, list) or not first_parts:
        return None

    try:
        year = int(first_parts[0])
        month = int(first_parts[1]) if len(first_parts) > 1 else 1
        day = int(first_parts[2]) if len(first_parts) > 2 else 1
        return date(year, month, day)
    except (TypeError, ValueError):
        return None


def _published_date(item: dict[str, Any]) -> date | None:
    for key in ("published-print", "published-online", "published", "issued", "created"):
        parsed_date = _date_from_crossref_date(item.get(key))
        if parsed_date is not None:
            return parsed_date
    return None


def _clean_abstract(value: Any) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return BeautifulSoup(value, "lxml").get_text(" ", strip=True) or None
    except Exception:
        logger.debug("Failed to strip Crossref abstract markup; returning raw text.")
        return " ".join(value.split())


def _license_urls(item: dict[str, Any]) -> list[str]:
    licenses = item.get("license")
    if not isinstance(licenses, list):
        return []

    urls: list[str] = []
    seen: set[str] = set()
    for license_item in licenses:
        if not isinstance(license_item, dict):
            continue
        url = license_item.get("URL") or license_item.get("url")
        if isinstance(url, str) and url.strip() and url.strip() not in seen:
            cleaned = url.strip()
            urls.append(cleaned)
            seen.add(cleaned)
    return urls


def _crossref_links(item: dict[str, Any]) -> list[dict[str, Any]]:
    links = item.get("link")
    if not isinstance(links, list):
        return []

    normalized_links: list[dict[str, Any]] = []
    for link in links:
        if isinstance(link, dict):
            normalized_links.append(
                {
                    "URL": link.get("URL") or link.get("url"),
                    "content-type": link.get("content-type"),
                    "content-version": link.get("content-version"),
                    "intended-application": link.get("intended-application"),
                }
            )
    return normalized_links


def _source_url(item: dict[str, Any]) -> str | None:
    url = _first_string(item.get("URL"))
    if url:
        return url

    resource = item.get("resource")
    if isinstance(resource, dict):
        primary = resource.get("primary")
        if isinstance(primary, dict):
            return _first_string(primary.get("URL"))
    return None


def _normalize_crossref_item(item: dict[str, Any]) -> dict[str, Any]:
    doi = _first_string(item.get("DOI"))
    issns = _string_list(item.get("ISSN"))
    return {
        "doi": doi.lower() if doi else None,
        "title": _first_string(item.get("title")),
        "journal_name": _first_string(item.get("container-title")),
        "issn": issns[0] if issns else None,
        "issns": issns,
        "publisher": _first_string(item.get("publisher")),
        "published_date": _published_date(item),
        "source_url": _source_url(item),
        "abstract": _clean_abstract(item.get("abstract")),
        "license_urls": _license_urls(item),
        "crossref_links": _crossref_links(item),
    }


def _crossref_headers() -> dict[str, str]:
    settings = get_settings()
    contact_email = settings.CROSSREF_CONTACT_EMAIL.strip()
    user_agent = "science-admin-backend/step3"
    if contact_email:
        user_agent = f"{user_agent} (mailto:{contact_email})"
    return {"User-Agent": user_agent}


def search_crossref_for_journal(issn: str, rows: int = 25) -> list[dict[str, Any]]:
    """Search Crossref for recent licensed journal articles by ISSN."""

    settings = get_settings()
    cleaned_issn = issn.strip()
    if not cleaned_issn:
        return []

    safe_rows = max(1, min(rows, settings.MAX_ARTICLES_PER_JOURNAL))
    params: dict[str, Any] = {
        "filter": f"issn:{cleaned_issn},type:journal-article,has-license:true",
        "sort": "published",
        "order": "desc",
        "rows": safe_rows,
    }
    if settings.CROSSREF_CONTACT_EMAIL.strip():
        params["mailto"] = settings.CROSSREF_CONTACT_EMAIL.strip()

    with httpx.Client(timeout=DEFAULT_TIMEOUT, follow_redirects=True, headers=_crossref_headers()) as client:
        response = client.get(CROSSREF_WORKS_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    message = payload.get("message", {}) if isinstance(payload, dict) else {}
    items = message.get("items", []) if isinstance(message, dict) else []
    if not isinstance(items, list):
        return []

    return [_normalize_crossref_item(item) for item in items if isinstance(item, dict)]
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.article import Article
from app.models.figure import ArticleFigure
from app.models.job import PipelineJob
from app.models.journal import Journal
from app.models.section import ArticleSection
from app.services.crossref_service import search_crossref_for_journal
from app.services.license_service import get_license_type, is_allowed_cc_by_license
from app.services.r2_storage_service import download_url_to_text, make_safe_doi_key, upload_text_to_r2
from app.services.xml_finder_service import find_xml_for_doi
from app.services.xml_parser_service import parse_jats_xml


logger = logging.getLogger(__name__)

DISCOVERY_JOB_TYPE = "article_discovery"
DISCOVERY_COUNT_KEYS = (
    "discovered",
    "created",
    "updated",
    "license_rejected",
    "xml_not_found",
    "extracted",
    "failed",
)
DUPLICATE_TITLE_WARNING_PREFIX = "Possible duplicate title with existing DOI:"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _safe_error_message(error: Exception | str, max_length: int = 1000) -> str:
    message = str(error).strip() or error.__class__.__name__ if isinstance(error, Exception) else str(error).strip()
    return message[:max_length]


def _normalize_doi(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.strip().lower()
    return cleaned or None


def normalize_title_for_duplicate_check(title: str | None) -> str | None:
    """Normalize an article title for conservative duplicate-title warnings."""

    if title is None:
        return None
    normalized = title.strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized or None


def _is_duplicate_title_warning(message: str | None) -> bool:
    return _duplicate_title_warning_from_error(message) is not None


def _duplicate_title_warning_from_error(message: str | None) -> str | None:
    if not message or not message.startswith(DUPLICATE_TITLE_WARNING_PREFIX):
        return None
    return message.split(";", 1)[0]


def _duplicate_title_warning(existing_doi: str) -> str:
    return f"{DUPLICATE_TITLE_WARNING_PREFIX} {existing_doi}"


def _clear_error_unless_duplicate_warning(article: Article) -> None:
    article.error_message = _duplicate_title_warning_from_error(article.error_message)


def _set_error_preserving_duplicate_warning(article: Article, error_message: str | None) -> None:
    duplicate_warning = _duplicate_title_warning_from_error(article.error_message)
    if duplicate_warning and error_message:
        article.error_message = f"{duplicate_warning}; {error_message}"
    elif duplicate_warning:
        article.error_message = duplicate_warning
    else:
        article.error_message = error_message


def _find_duplicate_title_existing_doi(
    db: Session,
    title: str | None,
    journal_name: str | None,
    current_doi: str,
) -> str | None:
    normalized_title = normalize_title_for_duplicate_check(title)
    if normalized_title is None:
        return None
    normalized_journal_name = (journal_name or "").strip().lower()

    query = select(Article).where(Article.doi != current_doi)

    for existing_article in db.scalars(query).all():
        existing_journal_name = (existing_article.journal_name or "").strip().lower()
        if (
            existing_journal_name == normalized_journal_name
            and normalize_title_for_duplicate_check(existing_article.title) == normalized_title
        ):
            return existing_article.doi
    return None


def _first_allowed_license(license_urls: list[str]) -> str | None:
    for license_url in license_urls:
        if is_allowed_cc_by_license(license_url):
            return license_url
    return None


def _first_license(license_urls: list[str]) -> str | None:
    for license_url in license_urls:
        if isinstance(license_url, str) and license_url.strip():
            return license_url.strip()
    return None


def _upsert_article_metadata(
    db: Session,
    result: dict[str, Any],
    journal: Journal,
    journal_issn: str,
) -> tuple[Article, bool]:
    doi = _normalize_doi(result.get("doi"))
    if doi is None:
        raise ValueError("Crossref result is missing DOI.")

    title = result.get("title") or doi
    journal_name = result.get("journal_name") or journal.name
    article = db.scalar(select(Article).where(Article.doi == doi))
    created = article is None
    if article is None:
        duplicate_doi = _find_duplicate_title_existing_doi(db, title, journal_name, doi)
        article = Article(doi=doi, title=title, status="metadata_found")
        if duplicate_doi:
            article.error_message = _duplicate_title_warning(duplicate_doi)
        db.add(article)

    article.doi = doi
    article.title = title or article.title or doi
    article.journal_name = journal_name
    article.journal_issn = result.get("issn") or journal_issn
    article.publisher = result.get("publisher") or journal.publisher
    article.published_date = result.get("published_date")
    article.source_url = result.get("source_url")
    article.abstract_from_metadata = result.get("abstract")
    article.field = journal.field
    article.priority_score = journal.priority
    return article, created


def _replace_sections_and_figures(db: Session, article_id, parsed_xml: dict[str, Any]) -> None:
    db.execute(delete(ArticleSection).where(ArticleSection.article_id == article_id))
    db.execute(delete(ArticleFigure).where(ArticleFigure.article_id == article_id))

    for section in parsed_xml.get("sections") or []:
        section_name = str(section.get("section_name") or "other")
        section_text = str(section.get("section_text") or "").strip()
        if section_text:
            db.add(
                ArticleSection(
                    article_id=article_id,
                    section_name=section_name,
                    section_text=section_text,
                    source=section.get("source") or "xml",
                )
            )

    for figure in parsed_xml.get("figures") or []:
        caption = str(figure.get("caption") or "").strip()
        if caption:
            db.add(
                ArticleFigure(
                    article_id=article_id,
                    figure_label=figure.get("figure_label"),
                    caption=caption,
                )
            )


def _mark_article_failed(db: Session, doi: str, error: Exception | str) -> None:
    try:
        article = db.scalar(select(Article).where(Article.doi == doi))
        if article is None:
            return
        article.status = "failed"
        _set_error_preserving_duplicate_warning(article, _safe_error_message(error))
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to mark article %s as failed.", doi)


def _set_job_finished(db: Session, job_id, counts: dict[str, int], status: str, error: str | None = None) -> None:
    job = db.get(PipelineJob, job_id)
    if job is None:
        return
    job.status = status
    job.finished_at = _utcnow()
    job.message = ", ".join(f"{key}={counts[key]}" for key in DISCOVERY_COUNT_KEYS)
    job.error_message = error
    db.commit()


def _journal_issns_in_priority_order(journal: Journal) -> list[str]:
    """Return journal ISSNs in Step 3 discovery priority order."""

    issns: list[str] = []
    for issn in (journal.issn_online, journal.issn_print):
        if issn and issn.strip() and issn.strip() not in issns:
            issns.append(issn.strip())
    return issns


def _search_journal_with_issn_fallback(journal: Journal, limit: int) -> tuple[list[dict[str, Any]], str | None]:
    """Search Crossref using online ISSN first, then print ISSN as fallback."""

    last_error: Exception | None = None
    for issn in _journal_issns_in_priority_order(journal):
        try:
            results = search_crossref_for_journal(issn, rows=limit)
        except Exception as exc:
            last_error = exc
            logger.warning("Crossref discovery failed for journal %s ISSN %s: %s", journal.name, issn, exc)
            continue

        if results:
            return results, issn

    if last_error is not None:
        raise last_error
    return [], None


def _process_crossref_article(
    db: Session,
    result: dict[str, Any],
    journal: Journal,
    journal_issn: str,
    counts: dict[str, int],
) -> None:
    doi = _normalize_doi(result.get("doi"))
    if doi is None:
        return

    article, created = _upsert_article_metadata(db, result, journal, journal_issn)
    counts["created" if created else "updated"] += 1

    license_urls = result.get("license_urls") or []
    allowed_license_url = _first_allowed_license(license_urls)
    fallback_license_url = _first_license(license_urls)

    if allowed_license_url is None:
        article.license_url = fallback_license_url
        article.license_type = get_license_type(fallback_license_url)
        article.status = "license_rejected"
        _set_error_preserving_duplicate_warning(article, "No accepted CC BY 4.0 license found.")
        db.commit()
        counts["license_rejected"] += 1
        return

    article.license_url = allowed_license_url
    article.license_type = get_license_type(allowed_license_url)
    article.status = "metadata_found"
    _clear_error_unless_duplicate_warning(article)
    db.commit()

    xml_result = find_xml_for_doi(doi, result.get("crossref_links"))
    article = db.scalar(select(Article).where(Article.doi == doi))
    if article is None:
        raise RuntimeError("Article disappeared during ingestion.")

    if not xml_result.get("found"):
        article.xml_url = None
        article.xml_source = None
        article.status = "xml_not_found"
        _set_error_preserving_duplicate_warning(
            article,
            str(xml_result.get("error")) if xml_result.get("error") else None,
        )
        db.commit()
        counts["xml_not_found"] += 1
        return

    xml_url = str(xml_result.get("xml_url") or "")
    if not xml_url:
        article.status = "xml_not_found"
        _set_error_preserving_duplicate_warning(article, "XML finder returned no XML URL.")
        db.commit()
        counts["xml_not_found"] += 1
        return

    article.xml_url = xml_url
    article.xml_source = str(xml_result.get("xml_source") or "") or None
    article.status = "xml_ready"
    _clear_error_unless_duplicate_warning(article)
    db.commit()

    xml_text = download_url_to_text(xml_url)
    r2_key = f"articles/xml/{make_safe_doi_key(doi)}.xml"
    upload_text_to_r2(xml_text, r2_key, content_type="application/xml")
    parsed_xml = parse_jats_xml(xml_text)

    article = db.scalar(select(Article).where(Article.doi == doi))
    if article is None:
        raise RuntimeError("Article disappeared before XML extraction save.")
    _replace_sections_and_figures(db, article.id, parsed_xml)
    article.xml_r2_key = r2_key
    article.status = "extracted"
    _clear_error_unless_duplicate_warning(article)
    db.commit()
    counts["extracted"] += 1


def discover_articles_for_active_journals(db: Session, limit_per_journal: int | None = None) -> dict[str, int]:
    """Discover CC BY articles for active journals and ingest available XML."""

    settings = get_settings()
    limit = limit_per_journal or settings.MAX_ARTICLES_PER_JOURNAL
    limit = max(1, min(limit, settings.MAX_ARTICLES_PER_JOURNAL))
    counts = {key: 0 for key in DISCOVERY_COUNT_KEYS}
    processed_dois: set[str] = set()

    job = PipelineJob(
        job_type=DISCOVERY_JOB_TYPE,
        status="running",
        started_at=_utcnow(),
        message=f"Starting Crossref discovery with limit_per_journal={limit}.",
        created_by="system",
    )
    db.add(job)
    db.commit()
    job_id = job.id

    try:
        journals = list(
            db.scalars(
                select(Journal)
                .where(Journal.active.is_(True))
                .order_by(Journal.priority.asc(), Journal.name.asc())
            ).all()
        )

        for journal in journals:
            if not _journal_issns_in_priority_order(journal):
                logger.info("Skipping journal without ISSN: %s", journal.name)
                continue

            try:
                crossref_results, journal_issn = _search_journal_with_issn_fallback(journal, limit)
            except Exception as exc:
                counts["failed"] += 1
                logger.warning("Crossref discovery failed for journal %s: %s", journal.name, exc)
                continue

            if journal_issn is None:
                logger.info("No Crossref results found for journal: %s", journal.name)
                continue

            for result in crossref_results:
                doi = _normalize_doi(result.get("doi"))
                if doi is None or doi in processed_dois:
                    continue
                processed_dois.add(doi)
                counts["discovered"] += 1

                try:
                    _process_crossref_article(db, result, journal, journal_issn, counts)
                except Exception as exc:
                    db.rollback()
                    counts["failed"] += 1
                    _mark_article_failed(db, doi, exc)
                    logger.warning("Article ingestion failed for DOI %s: %s", doi, exc)

        _set_job_finished(db, job_id, counts, "completed")
    except Exception as exc:
        db.rollback()
        safe_error = _safe_error_message(exc)
        try:
            _set_job_finished(db, job_id, counts, "failed", safe_error)
        except Exception:
            db.rollback()
            logger.exception("Failed to update discovery job after fatal error.")
        logger.exception("Article discovery run failed.")

    return counts

from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import quote

import httpx

from app.services.crossref_service import _crossref_headers


logger = logging.getLogger(__name__)

EUROPE_PMC_SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
EUROPE_PMC_FULL_TEXT_XML_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/{pmcid}/fullTextXML"
PMC_OAI_URL = (
    "https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi"
    "?verb=GetRecord&identifier=oai:pubmedcentral.nih.gov:{pmcid_number}&metadataPrefix=pmc"
)
DEFAULT_TIMEOUT = httpx.Timeout(20.0, connect=10.0)


def _empty_result(error: str | None = None) -> dict[str, str | bool | None]:
    return {
        "found": False,
        "xml_url": None,
        "xml_source": None,
        "pmcid": None,
        "error": error,
    }


def _found_result(xml_url: str, xml_source: str, pmcid: str | None = None) -> dict[str, str | bool | None]:
    return {
        "found": True,
        "xml_url": xml_url,
        "xml_source": xml_source,
        "pmcid": pmcid,
        "error": None,
    }


def _is_pdf(url: str | None, content_type: str | None = None) -> bool:
    normalized_url = (url or "").lower()
    normalized_type = (content_type or "").lower()
    return "pdf" in normalized_type or normalized_url.endswith(".pdf") or "/pdf" in normalized_url


def _is_likely_xml_url(url: str | None, content_type: str | None = None) -> bool:
    if not url or _is_pdf(url, content_type):
        return False

    normalized_type = (content_type or "").lower()
    normalized_url = url.lower()
    if any(token in normalized_type for token in ("xml", "jats", "nlm")):
        return True

    xml_url_patterns = (
        r"\.xml($|[?#])",
        r"/xml($|[/?#])",
        r"fulltextxml",
        r"full[-_]?text[-_]?xml",
        r"article[-_]?xml",
        r"jats",
        r"format=xml",
        r"type=xml",
    )
    return any(re.search(pattern, normalized_url) for pattern in xml_url_patterns)


def _find_xml_in_crossref_links(crossref_links: list[dict[str, Any]] | None) -> str | None:
    if not crossref_links:
        return None

    for link in crossref_links:
        if not isinstance(link, dict):
            continue
        url = link.get("URL") or link.get("url")
        content_type = link.get("content-type")
        if isinstance(url, str) and _is_likely_xml_url(url, str(content_type) if content_type else None):
            return url.strip()
    return None


def _as_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


def _search_europe_pmc(doi: str) -> dict[str, Any] | None:
    params = {
        "query": f'DOI:"{doi}"',
        "format": "json",
        "pageSize": 1,
    }
    with httpx.Client(timeout=DEFAULT_TIMEOUT, follow_redirects=True, headers=_crossref_headers()) as client:
        response = client.get(EUROPE_PMC_SEARCH_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    result_list = payload.get("resultList", {}) if isinstance(payload, dict) else {}
    results = result_list.get("result", []) if isinstance(result_list, dict) else []
    if isinstance(results, list) and results and isinstance(results[0], dict):
        return results[0]
    return None


def _find_xml_in_europe_pmc_full_text_urls(result: dict[str, Any]) -> str | None:
    full_text_url_list = result.get("fullTextUrlList")
    if not isinstance(full_text_url_list, dict):
        return None

    for item in _as_list(full_text_url_list.get("fullTextUrl")):
        if not isinstance(item, dict):
            continue
        url = item.get("url") or item.get("URL")
        document_style = item.get("documentStyle")
        availability = item.get("availability")
        if not isinstance(url, str):
            continue
        content_hint = " ".join(str(value) for value in (document_style, availability) if value)
        if _is_likely_xml_url(url, content_hint):
            return url.strip()
    return None


def _pmcid_number(pmcid: str | None) -> str | None:
    if not pmcid:
        return None
    match = re.search(r"(\d+)", pmcid)
    return match.group(1) if match else None


def find_xml_for_doi(doi: str, crossref_links: list[dict[str, Any]] | None = None) -> dict[str, str | bool | None]:
    """Find a structured XML/full-text source for a DOI without downloading PDFs."""

    cleaned_doi = doi.strip()
    if not cleaned_doi:
        return _empty_result("DOI is required.")

    crossref_xml_url = _find_xml_in_crossref_links(crossref_links)
    if crossref_xml_url:
        return _found_result(crossref_xml_url, "crossref")

    try:
        europe_pmc_result = _search_europe_pmc(cleaned_doi)
    except httpx.HTTPError as exc:
        logger.warning("Europe PMC lookup failed for DOI %s: %s", cleaned_doi, exc)
        europe_pmc_result = None
    except Exception as exc:
        logger.warning("Unexpected Europe PMC lookup failure for DOI %s: %s", cleaned_doi, exc)
        europe_pmc_result = None

    if not europe_pmc_result:
        return _empty_result()

    pmcid = europe_pmc_result.get("pmcid") if isinstance(europe_pmc_result.get("pmcid"), str) else None
    full_text_xml_url = _find_xml_in_europe_pmc_full_text_urls(europe_pmc_result)
    if full_text_xml_url:
        return _found_result(full_text_xml_url, "europe_pmc", pmcid)

    has_full_text = str(europe_pmc_result.get("hasFullText") or "").upper() == "Y"
    is_open_access = str(europe_pmc_result.get("isOpenAccess") or "").upper() == "Y"
    if pmcid and (has_full_text or is_open_access):
        quoted_pmcid = quote(pmcid, safe="")
        return _found_result(EUROPE_PMC_FULL_TEXT_XML_URL.format(pmcid=quoted_pmcid), "europe_pmc", pmcid)

    pmcid_number = _pmcid_number(pmcid)
    if pmcid_number and (has_full_text or is_open_access):
        return _found_result(PMC_OAI_URL.format(pmcid_number=pmcid_number), "pmc", pmcid)

    return _empty_result()
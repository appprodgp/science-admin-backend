
from __future__ import annotations

import re

import boto3
import httpx

from app.config import get_settings
from app.services.crossref_service import _crossref_headers


DEFAULT_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


def get_r2_client():
    """Create a Cloudflare R2 S3-compatible client without exposing secrets."""

    settings = get_settings()
    if not all(
        [
            settings.r2_endpoint_url,
            settings.R2_BUCKET_NAME.strip(),
            settings.R2_ACCESS_KEY_ID,
            settings.R2_SECRET_ACCESS_KEY,
        ]
    ):
        raise RuntimeError("R2 storage is not fully configured.")

    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID.get_secret_value(),
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY.get_secret_value(),
        region_name="auto",
    )


def make_safe_doi_key(doi: str) -> str:
    """Convert a DOI into a safe deterministic object-key fragment."""

    value = doi.strip().lower()
    value = re.sub(r"^https?://(dx\.)?doi\.org/", "", value)
    value = re.sub(r"^doi:\s*", "", value)
    value = re.sub(r"[^a-z0-9._-]+", "_", value)
    value = value.strip("._-")
    return value or "unknown_doi"


def upload_text_to_r2(text: str, key: str, content_type: str = "application/xml") -> str:
    settings = get_settings()
    client = get_r2_client()
    client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=text.encode("utf-8"),
        ContentType=content_type,
    )
    return key


def download_url_to_text(url: str) -> str:
    """Download XML/structured text from a URL, explicitly rejecting PDFs."""

    with httpx.Client(timeout=DEFAULT_TIMEOUT, follow_redirects=True, headers=_crossref_headers()) as client:
        response = client.get(url)
        response.raise_for_status()

    content_type = response.headers.get("content-type", "").lower()
    if "pdf" in content_type or url.lower().endswith(".pdf"):
        raise ValueError("PDF downloads are not allowed for Step 3 ingestion.")

    text = response.text
    if not text.strip():
        raise ValueError("Downloaded XML was empty.")
    return text


def save_xml_to_r2(doi: str, xml_url: str) -> dict[str, int | str]:
    xml_text = download_url_to_text(xml_url)
    key = f"articles/xml/{make_safe_doi_key(doi)}.xml"
    upload_text_to_r2(xml_text, key, content_type="application/xml")
    return {
        "r2_key": key,
        "size_bytes": len(xml_text.encode("utf-8")),
    }
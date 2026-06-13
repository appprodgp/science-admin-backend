from __future__ import annotations

import re
from urllib.parse import urlsplit, urlunsplit


_CC_HOSTS = {"creativecommons.org", "www.creativecommons.org"}
_KNOWN_CC_LICENSES = {
    "by": "CC BY",
    "by-nc": "CC BY-NC",
    "by-nd": "CC BY-ND",
    "by-nc-nd": "CC BY-NC-ND",
    "by-sa": "CC BY-SA",
}


def normalize_license_url(url: str | None) -> str | None:
    """Normalize a license URL for safe comparison.

    The function intentionally keeps the URL recognizable while removing common
    formatting differences that Crossref/publisher metadata may contain:
    whitespace, case differences, duplicate slashes, query strings, fragments,
    and insignificant trailing slashes.
    """

    if url is None:
        return None

    value = url.strip().lower()
    if not value:
        return None

    # Be forgiving when a manually pasted Creative Commons URL omits the scheme.
    if value.startswith("creativecommons.org/") or value.startswith("www.creativecommons.org/"):
        value = f"https://{value}"

    parsed = urlsplit(value)
    if not parsed.netloc:
        return value.rstrip("/") or None

    path = re.sub(r"/+", "/", parsed.path).rstrip("/")
    netloc = parsed.netloc.removeprefix("www.") if parsed.netloc in _CC_HOSTS else parsed.netloc
    return urlunsplit((parsed.scheme, netloc, path, "", ""))


def _creative_commons_license_parts(url: str | None) -> tuple[str, str] | None:
    normalized = normalize_license_url(url)
    if normalized is None:
        return None

    parsed = urlsplit(normalized)
    if parsed.netloc not in {"creativecommons.org"}:
        return None

    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) != 3 or parts[0] != "licenses":
        return None

    return parts[1], parts[2]


def is_allowed_cc_by_license(url: str | None) -> bool:
    """Return True only for Creative Commons Attribution 4.0 license URLs."""

    parts = _creative_commons_license_parts(url)
    if parts is None:
        return False

    license_code, version = parts
    return license_code == "by" and version == "4.0"


def get_license_type(url: str | None) -> str | None:
    """Return a human-readable Creative Commons license type when recognized."""

    parts = _creative_commons_license_parts(url)
    if parts is None:
        return None

    license_code, version = parts
    license_name = _KNOWN_CC_LICENSES.get(license_code)
    if license_name is None:
        return None
    return f"{license_name} {version}"
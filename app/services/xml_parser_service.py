
from __future__ import annotations

import re
from collections import OrderedDict

from bs4 import BeautifulSoup


SECTION_ORDER = ("abstract", "introduction", "methods", "results", "discussion", "conclusion", "other")


def _normalize_whitespace(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def _classify_section(title: str | None) -> str:
    normalized = (title or "").strip().lower()
    if not normalized:
        return "other"

    if "introduction" in normalized or "background" in normalized:
        return "introduction"
    if any(
        token in normalized
        for token in (
            "materials and methods",
            "methods",
            "methodology",
            "experimental procedures",
            "study design",
        )
    ):
        return "methods"
    if "results" in normalized or "findings" in normalized:
        return "results"
    if "discussion" in normalized or "interpretation" in normalized:
        return "discussion"
    if "conclusion" in normalized or "conclusions" in normalized or "summary" in normalized:
        return "conclusion"
    return "other"


def _text_without_direct_title(tag) -> str:
    clone = BeautifulSoup(str(tag), "xml")
    root = clone.find(tag.name)
    if root is None:
        return ""
    for title in root.find_all("title", recursive=False):
        title.decompose()
    for fig in root.find_all("fig"):
        fig.decompose()
    for ref_list in root.find_all("ref-list"):
        ref_list.decompose()
    return _normalize_whitespace(root.get_text(" ", strip=True))


def _extract_abstracts(soup: BeautifulSoup) -> str:
    abstracts: list[str] = []
    seen: set[str] = set()
    for abstract in soup.find_all("abstract"):
        text = _normalize_whitespace(abstract.get_text(" ", strip=True))
        text = re.sub(r"^abstract\s+", "", text, flags=re.IGNORECASE).strip()
        if text and text not in seen:
            abstracts.append(text)
            seen.add(text)
    return "\n\n".join(abstracts)


def _extract_sections(soup: BeautifulSoup) -> list[dict[str, str]]:
    buckets: OrderedDict[str, list[str]] = OrderedDict((section_name, []) for section_name in SECTION_ORDER)

    abstract_text = _extract_abstracts(soup)
    if abstract_text:
        buckets["abstract"].append(abstract_text)

    body = soup.find("body") or soup
    for sec in body.find_all("sec"):
        # Top-level sections already include their nested subsection text. Skipping
        # nested <sec> elements avoids duplicating text in the returned output.
        if sec.find_parent("sec") is not None:
            continue

        title_tag = sec.find("title", recursive=False) or sec.find("title")
        title = _normalize_whitespace(title_tag.get_text(" ", strip=True)) if title_tag else ""
        section_name = _classify_section(title)
        section_text = _text_without_direct_title(sec)
        if section_text:
            buckets[section_name].append(section_text)

    sections: list[dict[str, str]] = []
    for section_name, texts in buckets.items():
        combined_text = "\n\n".join(text for text in texts if text)
        if combined_text:
            sections.append(
                {
                    "section_name": section_name,
                    "section_text": combined_text,
                    "source": "xml",
                }
            )
    return sections


def _extract_figures(soup: BeautifulSoup) -> list[dict[str, str | None]]:
    figures: list[dict[str, str | None]] = []
    for fig in soup.find_all("fig"):
        label_tag = fig.find("label")
        caption_tag = fig.find("caption")
        label = _normalize_whitespace(label_tag.get_text(" ", strip=True)) if label_tag else None
        caption = _normalize_whitespace(caption_tag.get_text(" ", strip=True)) if caption_tag else ""
        if caption:
            figures.append({"figure_label": label, "caption": caption})
    return figures


def parse_jats_xml(xml_text: str) -> dict[str, list[dict[str, str | None]]]:
    """Parse JATS-like XML into normalized article sections and figure captions."""

    if not xml_text or not xml_text.strip():
        return {"sections": [], "figures": []}

    soup = BeautifulSoup(xml_text, "xml")
    for ref_list in soup.find_all("ref-list"):
        ref_list.decompose()

    return {
        "sections": _extract_sections(soup),
        "figures": _extract_figures(soup),
    }
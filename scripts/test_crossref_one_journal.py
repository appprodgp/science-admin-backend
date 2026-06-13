from __future__ import annotations

import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.services.crossref_service import search_crossref_for_journal


JOURNAL_NAME = "eLife"
JOURNAL_ISSN = "2050-084X"
ROWS = 3


def main() -> None:
    results = search_crossref_for_journal(JOURNAL_ISSN, rows=ROWS)
    print(f"Crossref results for {JOURNAL_NAME} ({JOURNAL_ISSN})")
    for index, item in enumerate(results, start=1):
        print(f"\n{index}. DOI: {item.get('doi')}")
        print(f"   Title: {item.get('title')}")
        print(f"   Licenses: {', '.join(item.get('license_urls') or []) or 'none'}")


if __name__ == "__main__":
    main()
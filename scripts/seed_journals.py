from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.database import SessionLocal, engine
from app.models.journal import Journal


JOURNALS: list[dict[str, Any]] = [
    {
        "name": "Nature Medicine",
        "issn_print": "1078-8956",
        "issn_online": "1546-170X",
        "publisher": "Springer Nature",
        "field": "medicine",
    },
    {
        "name": "Nature Biotechnology",
        "issn_print": "1087-0156",
        "issn_online": "1546-1696",
        "publisher": "Springer Nature",
        "field": "biotechnology",
    },
    {
        "name": "Nature Genetics",
        "issn_print": "1061-4036",
        "issn_online": "1546-1718",
        "publisher": "Springer Nature",
        "field": "genetics",
    },
    {
        "name": "Nature Neuroscience",
        "issn_print": "1097-6256",
        "issn_online": "1546-1726",
        "publisher": "Springer Nature",
        "field": "neuroscience",
    },
    {
        "name": "Nature Climate Change",
        "issn_print": None,
        "issn_online": "1758-6798",
        "publisher": "Springer Nature",
        "field": "climate",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "Nature Energy",
        "issn_print": None,
        "issn_online": "2058-7546",
        "publisher": "Springer Nature",
        "field": "energy",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "Science Advances",
        "issn_print": None,
        "issn_online": "2375-2548",
        "publisher": "American Association for the Advancement of Science",
        "field": "multidisciplinary",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "Nature Communications",
        "issn_print": None,
        "issn_online": "2041-1723",
        "publisher": "Springer Nature",
        "field": "multidisciplinary",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "ACS Central Science",
        "issn_print": None,
        "issn_online": "2374-7943",
        "publisher": "American Chemical Society",
        "field": "chemistry",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "eLife",
        "issn_print": None,
        "issn_online": "2050-084X",
        "publisher": "eLife Sciences Publications",
        "field": "life sciences",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "PNAS Nexus",
        "issn_print": None,
        "issn_online": "2752-6542",
        "publisher": "Oxford University Press",
        "field": "multidisciplinary",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "Cell Genomics",
        "issn_print": None,
        "issn_online": "2666-979X",
        "publisher": "Cell Press",
        "field": "genomics",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "Cell Reports Medicine",
        "issn_print": None,
        "issn_online": "2666-3791",
        "publisher": "Cell Press",
        "field": "medicine",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "The Lancet Digital Health",
        "issn_print": None,
        "issn_online": "2589-7500",
        "publisher": "Elsevier",
        "field": "digital health",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
    {
        "name": "JAMA Network Open",
        "issn_print": None,
        "issn_online": "2574-3805",
        "publisher": "American Medical Association",
        "field": "medicine",
        "notes": "TODO: Confirm whether a separate print ISSN exists before filling it in.",
    },
]


def seed_journals() -> None:
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured; cannot seed journals.")

    created = 0
    updated = 0
    with SessionLocal() as db:
        for journal_data in JOURNALS:
            existing = db.scalar(select(Journal).where(Journal.name == journal_data["name"]))
            data = {"priority": 2, "active": True, **journal_data}
            if existing is None:
                db.add(Journal(**data))
                created += 1
            else:
                for field, value in data.items():
                    setattr(existing, field, value)
                updated += 1
        db.commit()

    print(f"Seeded journals. created={created}, updated={updated}")


if __name__ == "__main__":
    seed_journals()
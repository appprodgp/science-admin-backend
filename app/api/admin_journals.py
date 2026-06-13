from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.journal import Journal
from app.schemas.journal import JournalCreate, JournalRead, JournalUpdate


router = APIRouter(prefix="/api/admin/journals", tags=["admin journals"])

DbSession = Annotated[Session, Depends(get_db)]


def _get_journal_or_404(db: Session, journal_id: UUID) -> Journal:
    journal = db.get(Journal, journal_id)
    if journal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal not found")
    return journal


def _journal_name_exists(db: Session, name: str, exclude_id: UUID | None = None) -> bool:
    query = select(Journal.id).where(Journal.name == name)
    if exclude_id is not None:
        query = query.where(Journal.id != exclude_id)
    return db.scalar(query) is not None


@router.get("/", response_model=list[JournalRead])
def list_journals(db: DbSession, active: bool | None = Query(default=None)) -> list[Journal]:
    query = select(Journal).order_by(Journal.priority.asc(), Journal.name.asc())
    if active is not None:
        query = query.where(Journal.active == active)
    return list(db.scalars(query).all())


@router.post("/", response_model=JournalRead, status_code=status.HTTP_201_CREATED)
def create_journal(payload: JournalCreate, db: DbSession) -> Journal:
    if _journal_name_exists(db, payload.name):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Journal name already exists")

    journal = Journal(**payload.model_dump())
    db.add(journal)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Journal name already exists") from exc
    db.refresh(journal)
    return journal


@router.get("/{journal_id}", response_model=JournalRead)
def get_journal(journal_id: UUID, db: DbSession) -> Journal:
    return _get_journal_or_404(db, journal_id)


@router.patch("/{journal_id}", response_model=JournalRead)
def update_journal(journal_id: UUID, payload: JournalUpdate, db: DbSession) -> Journal:
    journal = _get_journal_or_404(db, journal_id)
    update_data = payload.model_dump(exclude_unset=True)

    if "name" in update_data and _journal_name_exists(db, update_data["name"], exclude_id=journal_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Journal name already exists")

    for field, value in update_data.items():
        setattr(journal, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Journal name already exists") from exc
    db.refresh(journal)
    return journal


@router.delete("/{journal_id}", response_model=JournalRead)
def soft_delete_journal(journal_id: UUID, db: DbSession) -> Journal:
    journal = _get_journal_or_404(db, journal_id)
    journal.active = False
    db.commit()
    db.refresh(journal)
    return journal


from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.llm_run import LlmRun
from app.schemas.generation import LlmRunRead


router = APIRouter(prefix="/api/admin/llm-runs", tags=["admin llm runs"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/", response_model=list[LlmRunRead])
def list_llm_runs(
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[LlmRun]:
    query = select(LlmRun).order_by(LlmRun.created_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(query).all())


@router.get("/{llm_run_id}", response_model=LlmRunRead)
def get_llm_run(llm_run_id: UUID, db: DbSession) -> LlmRun:
    llm_run = db.get(LlmRun, llm_run_id)
    if llm_run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LLM run not found")
    return llm_run
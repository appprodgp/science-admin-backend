from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import PipelineJob
from app.schemas.job import PipelineJobRead


router = APIRouter(prefix="/api/admin/jobs", tags=["admin jobs"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/", response_model=list[PipelineJobRead])
def list_jobs(
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[PipelineJob]:
    query = select(PipelineJob).order_by(PipelineJob.created_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(query).all())


@router.get("/{job_id}", response_model=PipelineJobRead)
def get_job(job_id: UUID, db: DbSession) -> PipelineJob:
    job = db.get(PipelineJob, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.post("/test-job", response_model=PipelineJobRead, status_code=status.HTTP_201_CREATED)
def create_test_job(db: DbSession) -> PipelineJob:
    job = PipelineJob(
        job_type="test_job",
        status="pending",
        message="Fake test job created for validating the Step 2 admin API.",
        created_by="system",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


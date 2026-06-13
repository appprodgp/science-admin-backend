# Science Admin Backend

FastAPI backend for a production-grade science article admin system, built with SQLAlchemy 2.x, Alembic, Pydantic v2, and Neon PostgreSQL via `psycopg` v3.

Current implementation status:

- **Step 1 complete:** backend skeleton, `.env` loading, safe health/config/database checks, logging, and Neon connectivity.
- **Step 2 complete:** SQLAlchemy schema, Alembic migration, idempotent journal seed data, and backend admin CRUD/list APIs.

This project still intentionally does **not** implement Crossref article discovery, XML finding/parsing, OpenAI/Gemini LLM calls, Inngest workflows, or a Next.js admin dashboard.

## Windows PowerShell setup

From the project root:

```powershell
py -m venv venv
```

Activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation scripts on your machine, run this once for the current user and then activate again:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Upgrade `pip` and install dependencies:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Create `.env`

Do not commit real secrets. If `.env` does not exist, create it from the example file:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Use placeholder or real local development values as appropriate. The database URL should use SQLAlchemy's psycopg v3 driver format:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

The application exposes config-check routes that report whether required values are present, but they never return secret values.

## Run the API locally

```powershell
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive docs:

```text
http://127.0.0.1:8000/docs
```

## Step 2 database setup

Alembic reads `DATABASE_URL` from `.env` through `app.config`; credentials are not hardcoded in `alembic.ini`.

Create a migration from SQLAlchemy metadata when models change:

```powershell
python -m alembic revision --autogenerate -m "initial schema"
```

Apply migrations:

```powershell
python -m alembic upgrade head
```

Seed the journal whitelist idempotently:

```powershell
python scripts\seed_journals.py
```

The seed script inserts or updates these journals without creating duplicates:

- Nature Medicine
- Nature Biotechnology
- Nature Genetics
- Nature Neuroscience
- Nature Climate Change
- Nature Energy
- Science Advances
- Nature Communications
- ACS Central Science
- eLife
- PNAS Nexus
- Cell Genomics
- Cell Reports Medicine
- The Lancet Digital Health
- JAMA Network Open

## Validation commands

```powershell
python -m compileall app scripts
python -m alembic upgrade head
python scripts\seed_journals.py
uvicorn app.main:app --reload
```

If `alembic` or `uvicorn` are not on your shell `PATH`, run them through the virtual environment Python:

```powershell
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

## Routes to test

```powershell
Invoke-RestMethod http://127.0.0.1:8000/
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/api/admin/status
Invoke-RestMethod http://127.0.0.1:8000/api/admin/config-check
Invoke-RestMethod http://127.0.0.1:8000/api/admin/db-check
Invoke-RestMethod http://127.0.0.1:8000/api/admin/journals
Invoke-RestMethod http://127.0.0.1:8000/api/admin/articles
Invoke-RestMethod http://127.0.0.1:8000/api/admin/review/queue
Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/admin/jobs/test-job
Invoke-RestMethod http://127.0.0.1:8000/api/admin/jobs
Invoke-RestMethod http://127.0.0.1:8000/api/admin/llm-runs
```

Expected route purposes:

- `/` confirms the backend is running.
- `/health` returns basic service health.
- `/api/admin/status` returns basic app/admin API status without secrets.
- `/api/admin/config-check` verifies required configuration presence without exposing values.
- `/api/admin/db-check` runs `SELECT 1` against the configured database and returns whether it connected successfully.

## Step 2 admin API routes

### Journals

Prefix: `/api/admin/journals`

- `GET /` lists journals. Optional query: `active=true|false`.
- `POST /` creates a journal.
- `GET /{journal_id}` returns one journal.
- `PATCH /{journal_id}` updates a journal.
- `DELETE /{journal_id}` soft-deletes a journal by setting `active=false`.

Example journal create:

```powershell
$journal = @{
  name = "Example Science Journal"
  publisher = "Example Publisher"
  field = "test"
  priority = 2
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/api/admin/journals/ `
  -ContentType "application/json" `
  -Body $journal
```

### Articles

Prefix: `/api/admin/articles`

- `GET /` lists articles. Optional filters: `status`, `journal_name`, `field`, `curated`, `limit`, `offset`.
- `POST /` creates manual/fake article metadata for testing.
- `GET /{article_id}` returns one article.
- `PATCH /{article_id}` updates article metadata/status.
- `GET /{article_id}/sections` lists extracted sections.
- `GET /{article_id}/figures` lists extracted figures.
- `GET /{article_id}/generated` lists generated article drafts for the article.

Example fake article create:

```powershell
$article = @{
  doi = "10.1234/example-step2-test"
  title = "Example Step 2 Manual Test Article"
  journal_name = "Nature Medicine"
  journal_issn = "1546-170X"
  publisher = "Springer Nature"
  published_date = "2026-06-13"
  source_url = "https://example.com/article"
  license_type = "test"
  abstract_from_metadata = "Fake metadata-only article for API validation."
  status = "metadata_found"
  field = "medicine"
  priority_score = 5
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/api/admin/articles/ `
  -ContentType "application/json" `
  -Body $article
```

Allowed article statuses are documented in `app/models/article.py`.

### Review

Prefix: `/api/admin/review`

- `GET /queue` lists generated articles with `review_status="pending"`.
- `GET /queue/{generated_article_id}` returns one pending generated article with its parent article.
- `POST /{generated_article_id}/approve` approves a generated article, sets the parent article to `published`, sets `published_at`, and records a review event.
- `POST /{generated_article_id}/reject` rejects a generated article and records a review event.
- `PATCH /{generated_article_id}/edit` updates generated article fields and records an edit event.

Allowed review actions are documented in `app/models/review_event.py`.

### Jobs

Prefix: `/api/admin/jobs`

- `GET /` lists pipeline jobs.
- `GET /{job_id}` returns one job.
- `POST /test-job` creates a fake test job for validating the system.

### LLM runs

Prefix: `/api/admin/llm-runs`

- `GET /` lists LLM run records.
- `GET /{llm_run_id}` returns one LLM run record.

Step 2 only stores and lists LLM run records. It does not call OpenAI or Gemini.
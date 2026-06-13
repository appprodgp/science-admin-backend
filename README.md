# Science Admin Backend

FastAPI backend for a production-grade science article admin system, built with SQLAlchemy 2.x, Alembic, Pydantic v2, and Neon PostgreSQL via `psycopg` v3.

Current implementation status:

- **Step 1 complete:** backend skeleton, `.env` loading, safe health/config/database checks, logging, and Neon connectivity.
- **Step 2 complete:** SQLAlchemy schema, Alembic migration, idempotent journal seed data, and backend admin CRUD/list APIs.
- **Step 3 complete:** Crossref metadata discovery, CC BY 4.0 license filtering, structured XML finding/downloading, JATS-like XML parsing, Cloudflare R2 XML upload, and manual article ingestion.
- **Step 4 complete:** AI curation, plain-language draft generation, fact-checking, LLM audit logging, and pending-review handoff.
- **Step 5 complete:** Admin review workflow and local Next.js dashboard integration.
- **Step 6A complete:** FastAPI backend deployment preparation for Google Cloud Run, including Docker support, production-safe CORS/config checks, preflight script, and deployment notes.
- **Step 6B complete:** Next.js dashboard deployment preparation, including production env handling, Cloudflare deployment notes, Cloudflare Access guidance, and build checks.

This project still intentionally does **not** implement Inngest/background workflows, a public mobile app, PDF ingestion, GROBID, or automatic publishing.

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

For Step 3, configure these values when you want live discovery and R2 XML storage:

```env
CROSSREF_CONTACT_EMAIL=you@example.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_BASE_URL=...
```

`CROSSREF_CONTACT_EMAIL` is used in the Crossref `User-Agent` / `mailto` metadata. R2 secret values are only used by the storage client and are never returned by API responses.

For Step 4, configure at least one LLM provider before running AI curation/generation/fact-checking:

```env
OPENAI_API_KEY=...
OPENAI_MODEL_CURATION=gpt-4o-mini
OPENAI_MODEL_GENERATION=gpt-4o-mini
OPENAI_MODEL_FACTCHECK=gpt-4o-mini

GEMINI_API_KEY=...
GEMINI_MODEL_CURATION=gemini-2.5-flash
GEMINI_MODEL_GENERATION=gemini-2.5-flash

LLM_PRIMARY_PROVIDER=openai
LLM_FALLBACK_PROVIDER=gemini
MAX_LLM_GENERATIONS_PER_RUN=5
```

Secrets are never returned by config-check routes. Full prompts are not stored in the database; only LLM run metadata and safe error messages are saved.

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

## Step 6A backend deployment preparation

Step 6A prepares the FastAPI backend for Google Cloud Run deployment only. It does **not** deploy automatically, add public app APIs, add Inngest/background workflows, add PDF/GROBID processing, or change LLM prompts.

### Docker local test

Build the production-style container from the repository root:

```powershell
docker build -t science-admin-backend:local .
```

Run it locally with your uncommitted `.env` file:

```powershell
docker run --rm --env-file .env -p 8080:8080 science-admin-backend:local
```

The container listens on `0.0.0.0` and uses the Cloud Run-compatible `PORT` environment variable, defaulting to `8080` when `PORT` is not set.

Test the container:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/health
Invoke-RestMethod http://127.0.0.1:8080/api/admin/config-check
Invoke-RestMethod http://127.0.0.1:8080/api/admin/db-check
```

`/health` is intentionally lightweight and does not depend on the database. `/ready` and `/api/admin/db-check` safely run a simple database connectivity check.

### Production preflight

Run the preflight script before deployment configuration changes:

```powershell
python scripts\production_preflight.py
```

In local development mode it prints safe booleans/counts and skips production-required variable enforcement. With `ENVIRONMENT=production`, it checks required production variables, verifies database connectivity using the existing safe DB check, prints missing/invalid variable names only, and does not call OpenAI, Gemini, or Crossref or mutate the database.

### Cloud Run deployment outline

Deployment notes live in:

```text
deploy/cloud-run.md
```

The notes include required Google Cloud services, local Docker commands, Cloud Build and Cloud Run command templates, and post-deploy health/config/database check URLs. Placeholder names are used throughout: `PROJECT_ID`, `REGION`, `SERVICE_NAME`, and `IMAGE_NAME`.

Use `deploy/backend.env.example` as a placeholder-only reference for Cloud Run environment variables. Do not put real secrets in that file.

### Environment variable safety

- Never commit `.env`, `.env.*`, production env files, downloaded Secret Manager exports, private keys, or local secret files.
- Use Secret Manager or Cloud Run secret bindings for real `DATABASE_URL`, LLM API keys, and R2 credentials.
- `/api/admin/config-check` returns only booleans, counts, environment name, and numeric limits. It does not expose secret values.
- Production R2 configuration should use `R2_ENDPOINT_URL`. Existing local `R2_ACCOUNT_ID` support is kept for backward compatibility.

### CORS notes

- Local development allows `http://localhost:3000` and `http://127.0.0.1:3000` for the Next.js dashboard.
- Production CORS must be configured through `CORS_ALLOWED_ORIGINS` or `ADMIN_DASHBOARD_ORIGIN` and must contain exactly one deployed admin dashboard origin.
- Wildcard CORS origins (`*`) are rejected in production.

## Step 6B dashboard deployment preparation

Step 6B prepares the local Next.js admin dashboard in `science-admin-dashboard/` for deployment. It does **not** deploy automatically, add authentication code, implement a public app, add publishing features, store frontend secrets, or hard-code production backend URLs.

### Local dashboard build check

From the dashboard directory:

```powershell
cd science-admin-dashboard
npm run lint
npm run build
npm run check
```

`npm run check` runs linting and a production build.

### Production API base URL

All dashboard API calls use this public environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_CLOUD_RUN_URL
```

Use `science-admin-dashboard/.env.example` as the placeholder template. Keep local-only values in `science-admin-dashboard/.env.local`; that file is ignored and should not be committed.

`NEXT_PUBLIC_*` values are visible to browser users, so do not put API keys, database URLs, R2 credentials, or other secrets in the dashboard environment.

The dashboard header shows the configured API base URL and backend health status. If the backend is unreachable or the env var is missing, it displays a clear error message.

### Dashboard deployment options

Deployment notes live in:

```text
deploy/dashboard-deployment.md
```

The notes cover:

- **Option A: Cloudflare Pages static export** — only if the dashboard is converted to be static-export compatible. Current dynamic admin routes may make plain static export unsuitable.
- **Option B: Cloudflare Workers/OpenNext** — recommended for full Next.js App Router support.

Do not hard-code the production backend URL in source code. Configure `NEXT_PUBLIC_API_BASE_URL` in the Cloudflare deployment environment.

### Cloudflare Access protection

Cloudflare Access notes live in:

```text
deploy/cloudflare-access.md
```

Protect the deployed admin dashboard hostname with Cloudflare Access and allow only approved admin emails. The dashboard itself does not implement login yet; Cloudflare Access gates users before they reach the app. Later, backend-side verification of Cloudflare Access identity headers can be added if needed.

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
python scripts\test_llm_schema_validation.py
python scripts\test_xml_parse_sample.py
python scripts\test_crossref_one_journal.py
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
Invoke-RestMethod http://127.0.0.1:8000/api/admin/discovery/summary
Invoke-RestMethod -Method Post -ContentType "application/json" -Body '{"limit":1}' http://127.0.0.1:8000/api/admin/ai/run
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

## Step 3 article discovery and ingestion

Step 3 is limited to article discovery and extraction. It does not call OpenAI, Gemini, GROBID, or any article-generation/fact-checking workflow.

### Install Step 3 dependencies

The required parser/upload dependencies are included in `requirements.txt`:

- `beautifulsoup4==4.12.3`
- `lxml==5.3.0`
- `python-multipart==0.0.12`

Install all dependencies with:

```powershell
pip install -r requirements.txt
```

### Test Crossref metadata discovery without database writes

```powershell
python scripts\test_crossref_one_journal.py
```

The script queries a small number of recent Crossref records for the ISSN constant in the script and prints only DOI/title/license metadata.

### Test XML parsing without external APIs

```powershell
python scripts\test_xml_parse_sample.py
```

The sample parser script uses a tiny local JATS-like XML string and prints extracted sections and figure captions.

### Run discovery synchronously

Start the API:

```powershell
uvicorn app.main:app --reload
```

Then run a controlled discovery pass from Swagger or PowerShell:

```powershell
$body = @{ limit_per_journal = 3 } | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/api/admin/discovery/run `
  -ContentType "application/json" `
  -Body $body
```

Discovery currently runs synchronously. It:

1. Loads active journals.
2. Searches Crossref by online ISSN first, then print ISSN.
3. Accepts only CC BY 4.0 license URLs.
4. Finds structured XML/full-text sources from Crossref links, Europe PMC, or PMC-style OA metadata.
5. Downloads XML only, uploads it to R2 under `articles/xml/{safe_doi}.xml`, parses sections/figures, and marks articles `extracted`.

No PDFs are downloaded, and GROBID is not used.

### Discovery summary

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/admin/discovery/summary
```

The summary returns counts for:

- `metadata_found`
- `license_rejected`
- `xml_not_found`
- `xml_ready`
- `extracted`
- `failed`

### Inspect extracted articles, sections, and figures

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/admin/articles/?status=extracted"
```

For an extracted article ID:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/admin/articles/<ARTICLE_ID>/sections
Invoke-RestMethod http://127.0.0.1:8000/api/admin/articles/<ARTICLE_ID>/figures
```

### Manual article ingestion

Manual ingestion requires `permission_confirmed=true` and a CC BY 4.0 license URL. It creates or updates the article by DOI, stores pasted sections and figure captions, sets `xml_source="manual"`, and marks the article `extracted`.

```powershell
$manualArticle = @{
  doi = "10.1234/manual-step3-example"
  title = "Manual Step 3 Example Article"
  journal_name = "Example Open Journal"
  journal_issn = "1234-5678"
  publisher = "Example Publisher"
  published_date = "2026-06-13"
  source_url = "https://example.org/manual-step3-example"
  license_url = "https://creativecommons.org/licenses/by/4.0/"
  license_type = $null
  field = "biology"
  abstract = "A short manually pasted abstract."
  introduction = "A short introduction."
  methods = "A short methods section."
  results = "A short results section."
  discussion = "A short discussion section."
  conclusion = "A short conclusion."
  figure_captions = @("Figure 1. Example manually pasted caption.")
  permission_confirmed = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/api/admin/manual/articles `
  -ContentType "application/json" `
  -Body $manualArticle
```

Then inspect its extracted sections/figures using the existing article validation routes listed above.

## Step 4 AI curation, generation, and fact-checking

Step 4 converts already-extracted source articles into human-review-ready plain-language drafts. It is deliberately conservative:

- It processes only `status="extracted"` articles in batch runs unless you explicitly pass an `article_id`.
- It starts with curation and only generates drafts for selected articles.
- Generated drafts start as `review_status="draft"` and are not shown in the review queue until fact-checking passes.
- Fact-checking compares the generated draft against the extracted article context and stores `fact_check_json`.
- Passing fact-check sets the generated article to `review_status="pending"` and the source article to `status="pending_review"`.
- Failing fact-check sets `review_status="needs_revision"` and `status="generation_failed"`.
- Nothing is auto-published. Publishing still requires explicit admin review approval.

### Cost controls

Start with one article at a time:

```powershell
$body = @{ limit = 1; article_id = $null } | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/api/admin/ai/run `
  -ContentType "application/json" `
  -Body $body
```

The default API limit is `1`, and the maximum accepted limit is `MAX_LLM_GENERATIONS_PER_RUN`.

### Step 4 validation scripts

Schema validation only; no API calls:

```powershell
python scripts\test_llm_schema_validation.py
```

Controlled one-article curation test:

```powershell
python scripts\test_step4_one_article.py
```

`scripts/test_step4_one_article.py` finds one `extracted` article, prints its title/DOI, runs curation, and stops by default. It will not generate or fact-check unless you edit the top-level constant to `RUN_GENERATION = True`.

### Step 4 Swagger routes

Prefix: `/api/admin/ai`

- `POST /curate/{article_id}` curates one explicit article and returns the stored curation score.
- `POST /generate/{article_id}` generates one draft for a curated/selected article and leaves it as `review_status="draft"`.
- `POST /fact-check/{generated_article_id}` fact-checks one generated draft and stores `fact_check_json`.
- `POST /run` runs the synchronous Step 4 pipeline. Use `{"limit":1}` first.
- `GET /curation-scores/{article_id}` lists curation scores for an article.
- `GET /generated/{article_id}` lists generated drafts for an article.

Useful inspection routes after a run:

- `GET /api/admin/llm-runs/` shows LLM audit records.
- `GET /api/admin/review/queue` shows generated articles with `review_status="pending"`.
- `GET /api/admin/articles/?status=pending_review` shows articles ready for human review.
- `GET /api/admin/articles/?status=not_selected` shows articles rejected during AI curation.

### Step 4 article statuses

- `extracted`: XML/manual sections and figures are saved and ready for AI curation.
- `curated`: curation selected the source article for generation.
- `not_selected`: curation did not meet the hard-coded selection rule.
- `generation_pending`: draft text exists but fact-checking has not promoted it to review.
- `generation_failed`: fact-checking found unsupported claims, overhype, or missing limitations.
- `pending_review`: fact-checking passed and the generated draft is waiting for admin review.

Recommended Step 4 manual validation flow:

```powershell
python -m compileall app scripts
python scripts\test_llm_schema_validation.py
uvicorn app.main:app --reload
```

Then test in Swagger:

1. `POST /api/admin/ai/run` with `{"limit":1}`.
2. `GET /api/admin/llm-runs/`.
3. `GET /api/admin/review/queue`.
4. `GET /api/admin/articles/?status=pending_review`.
5. `GET /api/admin/articles/?status=not_selected`.

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

Step 4 stores every OpenAI/Gemini curation, generation, and fact-check attempt in `llm_runs` with provider/model, token estimates when available, status, and safe error messages only.
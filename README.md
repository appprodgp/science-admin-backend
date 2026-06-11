# Science Admin Backend

Step 1 foundation for a production-grade science article admin backend built with FastAPI, SQLAlchemy 2.x, and Neon PostgreSQL via `psycopg` v3.

This step intentionally includes only the backend skeleton, configuration loading, health/status routes, safe config checks, logging, and database connectivity checks. It does **not** implement Crossref ingestion, XML parsing, LLM generation, admin dashboard screens, Inngest workflows, or database tables yet.

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

## Routes to test

```powershell
Invoke-RestMethod http://127.0.0.1:8000/
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/api/admin/status
Invoke-RestMethod http://127.0.0.1:8000/api/admin/config-check
Invoke-RestMethod http://127.0.0.1:8000/api/admin/db-check
```

Expected route purposes:

- `/` confirms the backend is running.
- `/health` returns basic service health.
- `/api/admin/status` returns basic app/admin API status without secrets.
- `/api/admin/config-check` verifies required configuration presence without exposing values.
- `/api/admin/db-check` runs `SELECT 1` against the configured database and returns whether it connected successfully.
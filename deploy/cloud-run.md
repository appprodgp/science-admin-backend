# Cloud Run deployment notes for the FastAPI backend

These notes prepare the backend for Google Cloud Run deployment. They do not deploy automatically and they should not be used with real secrets committed to git.

## Required Google Cloud services

Enable these services in `PROJECT_ID` before deployment:

- Cloud Run
- Artifact Registry
- Cloud Build
- Secret Manager, recommended for real production secrets

Example:

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --project PROJECT_ID
```

## Local Docker test

Build the image locally:

```bash
docker build -t science-admin-backend:local .
```

Run it locally with your uncommitted `.env` file:

```bash
docker run --rm --env-file .env -p 8080:8080 science-admin-backend:local
```

Cloud Run injects a `PORT` environment variable. The Dockerfile command uses `${PORT:-8080}`, so it works both locally and on Cloud Run.

## Build with Cloud Build

Create an Artifact Registry Docker repository if you do not already have one:

```bash
gcloud artifacts repositories create IMAGE_NAME \
  --project PROJECT_ID \
  --repository-format docker \
  --location REGION
```

Build and push the image:

```bash
gcloud builds submit \
  --project PROJECT_ID \
  --tag REGION-docker.pkg.dev/PROJECT_ID/IMAGE_NAME/SERVICE_NAME:latest \
  .
```

## Deploy to Cloud Run

Use Secret Manager or the Cloud Run console for real secret values. Do not commit real env files. `deploy/backend.env.example` is only a placeholder template.

```bash
gcloud run deploy SERVICE_NAME \
  --project PROJECT_ID \
  --region REGION \
  --platform managed \
  --image REGION-docker.pkg.dev/PROJECT_ID/IMAGE_NAME/SERVICE_NAME:latest \
  --port 8080 \
  --allow-unauthenticated
```

Before serving production traffic, configure the required environment variables and secrets from `deploy/backend.env.example`. Secret Manager is recommended for `DATABASE_URL`, LLM API keys, and R2 credentials.

## Post-deploy checks

Get the Cloud Run URL:

```bash
SERVICE_URL=$(gcloud run services describe SERVICE_NAME \
  --project PROJECT_ID \
  --region REGION \
  --format='value(status.url)')
```

Health check, lightweight and not database-dependent:

```bash
curl "$SERVICE_URL/health"
```

Readiness check, database-dependent:

```bash
curl "$SERVICE_URL/ready"
```

Safe config check, values are never exposed:

```bash
curl "$SERVICE_URL/api/admin/config-check"
```

Database check:

```bash
curl "$SERVICE_URL/api/admin/db-check"
```

## Safety notes

- Never commit `.env`, production env files, downloaded secrets, key files, or Secret Manager exports.
- Cloud Run must use the `PORT` environment variable. The Dockerfile already respects it.
- Production CORS should contain only the deployed admin dashboard URL, for example in `CORS_ALLOWED_ORIGINS` or `ADMIN_DASHBOARD_ORIGIN`.
- Do not use wildcard CORS origins (`*`) in production.
# Dashboard deployment notes

These notes prepare the local Next.js admin dashboard in `science-admin-dashboard/` for **Cloudflare Pages static export** deployment. They do not deploy anything automatically.

The dashboard is an admin SPA-like frontend. It does not require SSR, Workers, Wrangler, or OpenNext. All backend API calls run in the browser through `NEXT_PUBLIC_API_BASE_URL`.

The dashboard must receive the backend URL through this public, non-secret environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://science-admin-backend-471704454900.us-central1.run.app
```

Do not store API keys, database URLs, R2 credentials, or other secrets in the dashboard. `NEXT_PUBLIC_*` values are visible to browser users. Do not hard-code the backend URL in dashboard source code; keep it in local/Cloudflare environment configuration.

## Local production build check

From the dashboard directory:

```bash
cd science-admin-dashboard
npm run lint
npm run build
```

`next.config.mjs` uses `output: "export"`, so `npm run build` produces a static export in `science-admin-dashboard/out`. The generated `out/` directory is ignored and should not be committed.

## Cloudflare Pages deployment

Create or update the Cloudflare Pages project with these settings:

- **Framework preset:** Next.js or None/custom
- **Build command:** `npm run build`
- **Output directory:** `out`
- **Root directory:** `science-admin-dashboard` if the Pages project is connected to the repository root

Configure this Cloudflare Pages environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://science-admin-backend-471704454900.us-central1.run.app
```

Because this is a static export, do not configure Workers, Wrangler, OpenNext, server functions, or SSR for the dashboard.

## Static route model

The dashboard avoids dynamic App Router paths so Cloudflare Pages can serve it as static files:

- Article detail uses `/article-detail?id=<article_id>` instead of `/articles/[articleId]`.
- Review detail uses `/review-detail?id=<generated_article_id>` instead of `/review/[generatedArticleId]`.
- List/detail data is fetched client-side from `NEXT_PUBLIC_API_BASE_URL`.

## Cloudflare Access protection

Protect the deployed Pages hostname with Cloudflare Access and allow only approved admin emails. The dashboard itself intentionally does not add login/authentication code; Cloudflare Access gates users before they reach the static site.

Cloudflare Access setup notes live in:

```text
deploy/cloudflare-access.md
```

## CORS reminder

The FastAPI backend production CORS setting must allow only the deployed dashboard origin, for example the Cloudflare Pages custom domain. Do not hard-code the backend production URL in dashboard source code.

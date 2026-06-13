# Dashboard deployment notes

These notes prepare the local Next.js admin dashboard in `science-admin-dashboard/` for deployment. They do not deploy anything automatically.

The dashboard must receive the backend URL through this public, non-secret environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_CLOUD_RUN_URL
```

Do not store API keys, database URLs, R2 credentials, or other secrets in the dashboard. `NEXT_PUBLIC_*` values are visible to browser users.

## Local production build check

From the dashboard directory:

```bash
cd science-admin-dashboard
npm run check
```

This runs linting and a production build. It does not deploy.

## Option A: Cloudflare Pages static export

Use this only if the dashboard is converted to be static-export compatible.

The current dashboard uses Next.js App Router server rendering and dynamic admin routes that fetch live backend data, so a plain static export may be unsuitable unless those routes are converted to static-compatible client-side fetching or another static-safe pattern.

Placeholder commands for a future static-export-compatible version:

```bash
cd science-admin-dashboard
npm run check
npm run build
# Placeholder only; configure static export before using this.
npx wrangler pages deploy out --project-name DASHBOARD_PROJECT_NAME
```

Set the production environment variable in Cloudflare Pages project settings:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_CLOUD_RUN_URL
```

## Option B: Cloudflare Workers/OpenNext

Recommended for full Next.js App Router support, including dynamic routes and server-rendered dashboard pages.

Placeholder commands for a future deployment task:

```bash
cd science-admin-dashboard
npm run check
# Placeholder only; add/configure OpenNext for Cloudflare before running these.
npx opennextjs-cloudflare build
npx wrangler deploy
```

Configure the Worker/Cloudflare environment with:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_CLOUD_RUN_URL
```

## CORS reminder

The FastAPI backend production CORS setting must allow only the deployed dashboard origin, for example the Cloudflare Pages or Workers custom domain. Do not hard-code the backend production URL in dashboard source code.
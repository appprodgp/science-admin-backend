# Cloudflare Access for the admin dashboard

The admin dashboard does not implement login yet. Protect the deployed dashboard domain with Cloudflare Access so only approved admins can reach the app.

## Recommended setup

1. Deploy the dashboard to a dedicated admin hostname, for example `admin.example.com`.
2. In Cloudflare Zero Trust, create an Access application for that hostname.
3. Add an Access policy that allows only the approved admin email addresses.
4. Deny everyone else by default.
5. Confirm users must pass Cloudflare Access before the dashboard loads.

Cloudflare Access gates access before users reach the dashboard. The app itself still does not contain authentication code, sessions, login pages, or secret credentials.

## Admin emails

Keep the allowed admin email list in Cloudflare Access policy configuration. Do not store private credentials or API secrets in the frontend.

## Future backend hardening

Later, we can add backend-side verification of Cloudflare Access identity headers if needed. That is intentionally not part of Step 6B.
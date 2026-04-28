# CLAUDE.md

## Project Notes

- This repo is the main TrawlerWatch mapping dashboard.
- The sibling `..\aisstream` repo is the AIS ingestion server that feeds the dashboard.
- Keep dashboard, ingestion, map/feed logic, and database schema changes minimal unless explicitly asked to redesign.

## Auth

- Current auth is Basic Baked Users Auth.
- It uses NextAuth CredentialsProvider, JWT sessions, bcryptjs password hashes, and a single `users` table.
- Any logged-in user can access the dashboard and `/admin/users`.
- `/api/admin/setup` creates the `users` table and initial `admin@local` user if no users exist.
- Auth redirects must stay environment-safe: use same-site relative paths such as `/` and `/login`; do not hardcode localhost, fixed ports, or production domains.

## Future Auth Reminder

- Before commercial/production use, replace this minimal auth with full auth.
- Set `NEXTAUTH_SECRET` in deployment and stop relying on the baked fallback secret.
- Add proper roles, permissions, audit logging, and account recovery only when requested.

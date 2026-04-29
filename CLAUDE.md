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

<!-- BEGIN LOCAL PM2 DEV SERVER POLICY -->

# Local dev server policy

This repo's dev server is managed by PM2 from the parent workspace.

Parent workspace:

```text
C:\Users\zebedee\Desktop\claud
```

PM2 ecosystem file:

```text
C:\Users\zebedee\Desktop\claud\ecosystem.config.js
```

PM2 app name for this repo:

```text
trawlerwatch
```

## Required commands

Check status:

```powershell
pm2 status trawlerwatch
```

View logs:

```powershell
pm2 logs trawlerwatch --lines 120
```

Restart after code changes:

```powershell
pm2 restart trawlerwatch
```

Start if missing:

```powershell
pm2 start "C:\Users\zebedee\Desktop\claud\ecosystem.config.js" --only trawlerwatch
```

Stop:

```powershell
pm2 stop trawlerwatch
```

## Strict rules

Do not start this repo's dev server directly with:

- npm run dev
- pnpm dev
- yarn dev
- next dev
- vite
- node server start commands
- Start-Process
- cmd /c start
- bash background commands
- wsl background commands

Use PM2 only.

Do not kill processes by name. Never run broad commands such as:

```powershell
Stop-Process -Name node -Force
taskkill /F /IM node.exe /T
Stop-Process -Name powershell -Force
taskkill /F /IM cmd.exe /T
```

Only stop or restart the named PM2 app for this repo.

If `pm2 status trawlerwatch` does not show the app, report that PM2 is not managing it. Do not improvise by launching a raw server.

Connection failures do not automatically mean a port clash. Check PM2 status and logs before taking action.

<!-- END LOCAL PM2 DEV SERVER POLICY -->



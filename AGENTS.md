# AGENTS.md

<-- Added by write-agents-md-all.bat -->

## Generic agent instructions

Before making changes:

- Read `CLAUDE.md` first if it exists.
- Check `git status` and inspect any existing diffs.
- Preserve the existing architecture unless explicitly asked to redesign it.
- Make the smallest safe change that satisfies the task.
- Do not overwrite user changes or unrelated agent changes.
- Inspect only the files needed for the task.
- Run relevant tests when practical, or explain why they were not run.
- Keep branding, UX direction, and product decisions consistent with existing repo guidance.

## Project-specific instructions

- This repo is the main TrawlerWatch dashboard. The sibling `..\aisstream` repo is the AIS ingestion server that feeds the dashboard. Treat them as one system with two repos.
- The dashboard runs locally on `http://localhost:3030` via `npm run dev`. If login or Supabase Auth sends the browser to `localhost:3000` after authentication, treat that as a misconfigured redirect and update the auth redirect/Site URL to `http://localhost:3030`.
- The ingestion server runs locally on `http://localhost:5000` via `npm run dev` in `..\aisstream`. The dashboard reaches it through `AIS_INTERNAL_URL`, usually pointing at the ingestion server `/status` endpoint; dashboard API routes derive other ingestion endpoints from that base URL.
- When dashboard behavior depends on live vessels, AIS status, locale changes, persistence, or stream health, inspect `..\aisstream` as well as this repo before making changes.
- Auth is currently Basic Baked Users Auth: NextAuth CredentialsProvider, JWT sessions, a baked fallback secret, and a single `users` table. Keep it minimal unless explicitly asked to implement full production auth.
- Before commercial/production use, replace Basic Baked Users Auth with full auth: set `NEXTAUTH_SECRET`, remove reliance on baked fallback secrets, and add proper roles/permissions/auditing as needed.

## System structure

- Dashboard repo (`trawlerwatch`):
  - `src/app/page.tsx` owns the main map page state: selected vessel, filters, map theme, EEZ toggle, and active locale.
  - `src/lib/hooks/useAISStream.ts` polls `/api/vessels` every 5 seconds, transforms ingestion `AISUpdate` records into dashboard `VesselWithPosition` objects, and replaces client state from the backend source of truth.
  - `src/app/api/vessels/route.ts` proxies to ingestion `/vessels`.
  - `src/app/api/ais-status/route.ts` proxies to the configured `AIS_INTERNAL_URL`.
  - `src/app/api/ais-locale/route.ts` posts locale changes to ingestion `/locale`.
  - `src/lib/locales.ts` defines dashboard locales, centers, zooms, and bounding boxes. Keep this aligned with `..\aisstream\src\locales.ts`.
  - `src/components/map/TrawlerMap.tsx` is the Leaflet map. Leaflet must stay client-side only via dynamic import / browser-only effects.
  - `src/components/sidebar/*` and `src/components/ui/*` render filters, vessel details, stats, legend, map controls, and locale selection.
  - `src/app/login`, `src/app/admin/users`, `src/app/api/auth/[...nextauth]`, `src/app/api/admin/setup`, and `src/app/api/admin/users` implement Basic Baked Users Auth.
  - `SUPABASE_SETUP.sql` is the older Supabase schema path. Current live AIS reads are primarily proxied from `aisstream`.
- Ingestion repo (`..\aisstream`):
  - `src/server.ts` connects to AISStream over WebSocket, parses position and static AIS messages, merges vessel state by MMSI, broadcasts browser WebSocket updates, and exposes HTTP endpoints.
  - `src/db.ts` manages optional Neon/Postgres persistence using `DATABASE_URL`, including schema setup, bulk vessel upserts, startup hydration reads, and stale-record cleanup.
  - `src/locales.ts` defines AIS subscription bounding boxes. Keep IDs and regions aligned with the dashboard locales.
  - `db/schema.sql` documents the vessel table schema for manual setup or inspection.
  - `public/index.html` is a standalone ingestion/debug viewer, not the main dashboard UI.

## Required working skills

- Next.js App Router and React client components: preserve server/client boundaries, especially for Leaflet and browser-only APIs.
- TypeScript data-shape discipline: keep `AISUpdate`, `VesselWithPosition`, `Position`, locale IDs, and nav-status mappings consistent across dashboard and ingestion.
- Leaflet map work: avoid SSR access to Leaflet, clean up markers/layers, and maintain stable map state during polling.
- AIS domain basics: MMSI is the vessel identity key; position reports and static ship data arrive separately and must be merged without overwriting known values with nulls.
- Node HTTP/WebSocket services: ingestion uses `http`, `ws`, and AISStream upstream reconnect logic; test endpoint changes against `/status`, `/vessels`, `/locale`, `/locales`, and `/debug`.
- Postgres/Neon persistence: ingestion writes merged vessel state in bulk batches, throttles position writes, loads recent state once on startup for recovery, and cleans up stale data after 24 hours. Dashboard `/vessels` reads should be served from `aisstream` memory, not Neon.
- Environment configuration: dashboard uses `AIS_INTERNAL_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; ingestion uses `DATABASE_URL` and AISStream connection settings. Do not move secrets into client-side dashboard code.
- Dashboard auth requires server-side `DATABASE_URL` for the `users` table. `NEXTAUTH_SECRET` is optional for now because there is a baked fallback, but it must be set before production use.

## Change workflow

- For dashboard-only UI changes, work in this repo and run `npm run build` when practical.
- For live AIS data, locale, endpoint, or persistence changes, inspect both repos and update both sides when their contracts change.
- If adding or changing a locale, update both `src/lib/locales.ts` in this repo and `..\aisstream\src\locales.ts`, then verify that dashboard locale switching calls ingestion `/locale` successfully.
- If changing the ingestion response shape, update `src/lib/hooks/useAISStream.ts` and dashboard types at the same time.
- If changing ingestion database columns, update `..\aisstream\src\db.ts`, `..\aisstream\db\schema.sql`, and any dashboard transform code that consumes those fields.
- Avoid editing generated or incidental files such as `.next`, `node_modules`, `package-lock.json`, and `tsconfig.tsbuildinfo` unless the task explicitly requires it.

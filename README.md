# TrawlerWatch 🌊

Ecological monitoring of trawling activity in UK waters.  
A MarineTraffic-style AIS vessel tracking app built with Next.js, Leaflet, and Supabase.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Framework  | Next.js 14 (App Router)           |
| Language   | TypeScript                        |
| Map        | Leaflet (raw, SSR-safe)           |
| Database   | Supabase (PostgreSQL + RLS)       |
| Styling    | Tailwind CSS                      |
| Deployment | Vercel                            |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template (mock data works with no Supabase setup)
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs with 40 realistic sample vessels out of the box —
no Supabase account needed until you want live data.

---

## Connecting Supabase (optional)

See the **SUPABASE_SETUP.sql** file (provided separately) for:
- Full schema (vessels + positions tables)
- Row-Level Security policies
- Seed data matching the mock dataset

Once your database is ready:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_USE_LIVE_DATA=true
```

---

## Deploying to Vercel

```bash
# Option A — via Vercel dashboard
# Push to GitHub, import repo at vercel.com, add env vars, deploy.

# Option B — via CLI
npm i -g vercel
vercel
```

---

## Switching to a Live AIS Feed

Edit `src/lib/data/vesselService.ts` only — replace the two
`fetchFromSupabase` functions with calls to your AIS provider.
All frontend components are data-source agnostic.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Leaflet overrides, fonts, scrollbars
│   ├── layout.tsx         # Root layout + metadata
│   └── page.tsx           # Main page — state orchestration
├── components/
│   ├── map/
│   │   └── TrawlerMap.tsx # Leaflet map, markers, trails
│   ├── sidebar/
│   │   ├── FilterPanel.tsx
│   │   ├── Sidebar.tsx
│   │   ├── VesselDetail.tsx
│   │   └── VesselListItem.tsx
│   └── ui/
│       ├── MapLegend.tsx
│       └── StatsBar.tsx
├── lib/
│   ├── data/
│   │   ├── mockData.ts      # 40 AIS-style sample vessels
│   │   └── vesselService.ts # Data layer — swap mock ↔ Supabase here
│   ├── supabase/
│   │   └── client.ts
│   └── utils.ts
└── types/
    └── index.ts
```

-- =============================================================================
-- TRAWLERWATCH — SUPABASE SETUP
-- =============================================================================
-- Paste this entire file into the Supabase SQL Editor and click Run.
-- Dashboard → SQL Editor → New query → paste → Run
--
-- This file is structured in four clearly labelled sections:
--   1. SCHEMA      — table definitions, indexes, constraints, view
--   2. RLS         — enable Row Level Security on both tables
--   3. POLICIES    — read-only public access; all writes blocked
--   4. SEED DATA   — 40 sample vessels + one position record each
-- =============================================================================


-- =============================================================================
-- SECTION 1: SCHEMA
-- =============================================================================

-- ---------------------------------------------------------------------------
-- vessels
-- One row per vessel. Static / slowly-changing vessel metadata.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vessels (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    mmsi            TEXT        NOT NULL UNIQUE,   -- 9-digit AIS identifier
    imo             TEXT,                           -- IMO number (optional)
    name            TEXT        NOT NULL,
    callsign        TEXT,
    flag            TEXT        NOT NULL,           -- Full country name
    flag_code       TEXT        NOT NULL,           -- ISO 3166-1 alpha-2 e.g. "GB"
    vessel_type     TEXT        NOT NULL DEFAULT 'Fishing Vessel',
    length_m        NUMERIC(6,1),
    width_m         NUMERIC(5,1),
    gross_tonnage   INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vessels_mmsi      ON public.vessels (mmsi);
CREATE INDEX IF NOT EXISTS idx_vessels_flag_code ON public.vessels (flag_code);


-- ---------------------------------------------------------------------------
-- positions
-- Append-only AIS position log. One row per message received.
-- The "current" position for each vessel is the row with the latest timestamp.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.positions (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id            UUID        NOT NULL REFERENCES public.vessels (id) ON DELETE CASCADE,
    mmsi                 TEXT        NOT NULL,      -- denormalised for fast queries
    latitude             NUMERIC(9,6) NOT NULL,     -- WGS-84 decimal degrees
    longitude            NUMERIC(9,6) NOT NULL,     -- WGS-84 decimal degrees
    speed_over_ground    NUMERIC(5,1) NOT NULL,     -- knots; 102.3 = not available
    course_over_ground   NUMERIC(5,1) NOT NULL,     -- degrees 0.0–359.9
    heading              SMALLINT    NOT NULL,       -- degrees 0–359; 511 = not available
    nav_status           TEXT        NOT NULL DEFAULT 'unknown',
    destination          TEXT,
    draught              NUMERIC(4,1),              -- metres
    timestamp            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_positions_vessel_id  ON public.positions (vessel_id);
CREATE INDEX IF NOT EXISTS idx_positions_mmsi       ON public.positions (mmsi);
CREATE INDEX IF NOT EXISTS idx_positions_timestamp  ON public.positions (timestamp DESC);
-- Composite index for the "latest position per vessel" query pattern
CREATE INDEX IF NOT EXISTS idx_positions_vessel_time
    ON public.positions (vessel_id, timestamp DESC);


-- ---------------------------------------------------------------------------
-- nav_status allowed values
-- ---------------------------------------------------------------------------
ALTER TABLE public.positions
    DROP CONSTRAINT IF EXISTS chk_nav_status;

ALTER TABLE public.positions
    ADD CONSTRAINT chk_nav_status CHECK (
        nav_status IN (
            'underway_engine',
            'at_anchor',
            'not_under_command',
            'restricted_manoeuvrability',
            'constrained_draught',
            'moored',
            'aground',
            'fishing',
            'underway_sailing',
            'reserved',
            'unknown'
        )
    );


-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vessels_updated_at ON public.vessels;
CREATE TRIGGER trg_vessels_updated_at
    BEFORE UPDATE ON public.vessels
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Convenience view: latest position per vessel
-- Use this in the app instead of a subquery when you want the current picture.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vessel_current_positions AS
SELECT
    v.id               AS vessel_id,
    v.mmsi,
    v.imo,
    v.name,
    v.callsign,
    v.flag,
    v.flag_code,
    v.vessel_type,
    v.length_m,
    v.width_m,
    v.gross_tonnage,
    p.id               AS position_id,
    p.latitude,
    p.longitude,
    p.speed_over_ground,
    p.course_over_ground,
    p.heading,
    p.nav_status,
    p.destination,
    p.draught,
    p.timestamp        AS last_seen
FROM public.vessels v
JOIN public.positions p ON p.vessel_id = v.id
JOIN (
    SELECT vessel_id, MAX(timestamp) AS max_ts
    FROM   public.positions
    GROUP  BY vessel_id
) latest ON latest.vessel_id = p.vessel_id
        AND latest.max_ts    = p.timestamp;


-- =============================================================================
-- SECTION 2: ROW LEVEL SECURITY
-- =============================================================================
-- Enable RLS on both tables.  Without an explicit policy, no rows are visible.

ALTER TABLE public.vessels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 3: POLICIES
-- =============================================================================
-- Design intent:
--   • Anyone (anon or authenticated) can READ all rows.
--   • Nobody can INSERT, UPDATE, or DELETE via the public anon key.
--   • Only your server-side ingestion process (using the service_role key,
--     which bypasses RLS entirely) should write data.

-- ---------------------------------------------------------------------------
-- vessels policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "public_read_vessels"          ON public.vessels;
DROP POLICY IF EXISTS "block_public_insert_vessels"  ON public.vessels;
DROP POLICY IF EXISTS "block_public_update_vessels"  ON public.vessels;
DROP POLICY IF EXISTS "block_public_delete_vessels"  ON public.vessels;

CREATE POLICY "public_read_vessels"
    ON public.vessels FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "block_public_insert_vessels"
    ON public.vessels FOR INSERT
    TO anon, authenticated
    WITH CHECK (false);

CREATE POLICY "block_public_update_vessels"
    ON public.vessels FOR UPDATE
    TO anon, authenticated
    USING (false);

CREATE POLICY "block_public_delete_vessels"
    ON public.vessels FOR DELETE
    TO anon, authenticated
    USING (false);


-- ---------------------------------------------------------------------------
-- positions policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "public_read_positions"         ON public.positions;
DROP POLICY IF EXISTS "block_public_insert_positions" ON public.positions;
DROP POLICY IF EXISTS "block_public_update_positions" ON public.positions;
DROP POLICY IF EXISTS "block_public_delete_positions" ON public.positions;

CREATE POLICY "public_read_positions"
    ON public.positions FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "block_public_insert_positions"
    ON public.positions FOR INSERT
    TO anon, authenticated
    WITH CHECK (false);

CREATE POLICY "block_public_update_positions"
    ON public.positions FOR UPDATE
    TO anon, authenticated
    USING (false);

CREATE POLICY "block_public_delete_positions"
    ON public.positions FOR DELETE
    TO anon, authenticated
    USING (false);


-- =============================================================================
-- SECTION 4: SEED DATA
-- =============================================================================
-- 40 sample vessels matching the mock data in src/lib/data/mockData.ts.
-- Each vessel gets one initial position record.
-- Timestamps are set to fixed offsets so data looks "live" when first loaded.
-- Safe to re-run — INSERT … ON CONFLICT DO NOTHING.

INSERT INTO public.vessels
    (id, mmsi, imo, name, callsign, flag, flag_code, vessel_type, length_m, width_m, gross_tonnage)
VALUES
  ('00000000-0000-0000-0000-000000000001','232001234','9123456', 'RESOLUTE DAWN',    'MXAB2','United Kingdom','GB','Fishing Vessel', 28,  7,  198),
  ('00000000-0000-0000-0000-000000000002','232002345', NULL,     'NORTHERN STAR',    'MXCD3','United Kingdom','GB','Fishing Vessel', 24,  6,  145),
  ('00000000-0000-0000-0000-000000000003','232003456','9234567', 'OCEAN HARVEST',    'MXEF4','United Kingdom','GB','Fishing Vessel', 34,  8,  312),
  ('00000000-0000-0000-0000-000000000004','235004567','9345678', 'SILVER SPRAY',     'MXGH5','United Kingdom','GB','Fishing Vessel', 22,  6,  118),
  ('00000000-0000-0000-0000-000000000005','232005678', NULL,     'GALWAD-Y-MOR',     'MWYW1','United Kingdom','GB','Fishing Vessel', 18,  5,   67),
  ('00000000-0000-0000-0000-000000000006','244006789','9456789', 'FLANDRIA IV',      'PBZZ6','Netherlands',   'NL','Fishing Vessel', 40, 10,  485),
  ('00000000-0000-0000-0000-000000000007','244007890','9567890', 'MARIA JOHANNA',    'PBAA7','Netherlands',   'NL','Fishing Vessel', 38,  9,  420),
  ('00000000-0000-0000-0000-000000000008','246008901','9678901', 'GERRIT SENIOR',    'PCBB8','Netherlands',   'NL','Fishing Vessel', 42, 10,  530),
  ('00000000-0000-0000-0000-000000000009','257009012', NULL,     'SJØSPRØYT',        'LMBC9','Norway',        'NO','Fishing Vessel', 45, 11,  640),
  ('00000000-0000-0000-0000-000000000010','257010123','9789012', 'HAVØRN',           'LMBD0','Norway',        'NO','Fishing Vessel', 52, 12,  780),
  ('00000000-0000-0000-0000-000000000011','250011234', NULL,     'CELTIC MIST',      'EIME1','Ireland',       'IE','Fishing Vessel', 26,  7,  175),
  ('00000000-0000-0000-0000-000000000012','250012345','9890123', 'ATLANTIC PRIDE',   'EIMF2','Ireland',       'IE','Fishing Vessel', 35,  9,  350),
  ('00000000-0000-0000-0000-000000000013','227013456','9901234', 'BONNE ESPÉRANCE', 'FZAB3','France',        'FR','Fishing Vessel', 38,  9,  410),
  ('00000000-0000-0000-0000-000000000014','227014567', NULL,     'ÉTOILE DU NORD',  'FZAC4','France',        'FR','Fishing Vessel', 30,  8,  245),
  ('00000000-0000-0000-0000-000000000015','232015678','9012345', 'FAITHFUL',         'MXIJ5','United Kingdom','GB','Fishing Vessel', 20,  6,   95),
  ('00000000-0000-0000-0000-000000000016','232016789', NULL,     'GUIDE ME',         'MXKL6','United Kingdom','GB','Fishing Vessel', 16,  5,   48),
  ('00000000-0000-0000-0000-000000000017','235017890','9123450', 'PROVIDER',         'MXMN7','United Kingdom','GB','Fishing Vessel', 30,  8,  265),
  ('00000000-0000-0000-0000-000000000018','232018901', NULL,     'SUNRISE',          'MXOP8','United Kingdom','GB','Fishing Vessel', 14,  4,   38),
  ('00000000-0000-0000-0000-000000000019','232019012','9234501', 'EASTERN PROMISE',  'MXQR9','United Kingdom','GB','Fishing Vessel', 26,  7,  188),
  ('00000000-0000-0000-0000-000000000020','224020123','9345012', 'MAR AZUL',         'EBCA0','Spain',         'ES','Fishing Vessel', 48, 12,  720),
  ('00000000-0000-0000-0000-000000000021','232021234', NULL,     'ARGONAUT',         'MXST1','United Kingdom','GB','Fishing Vessel', 22,  6,  125),
  ('00000000-0000-0000-0000-000000000022','232022345','9456012', 'HELEN MARY',       'MXUV2','United Kingdom','GB','Fishing Vessel', 24,  7,  155),
  ('00000000-0000-0000-0000-000000000023','248023456','9567012', 'STELLA MARIS',     '9HAB3','Malta',         'MT','Fishing Vessel', 36,  9,  365),
  ('00000000-0000-0000-0000-000000000024','232024567', NULL,     'VENTURE',          'MXWX4','United Kingdom','GB','Fishing Vessel', 18,  5,   72),
  ('00000000-0000-0000-0000-000000000025','235025678','9678012', 'UNITY',            'MXYZ5','United Kingdom','GB','Fishing Vessel', 32,  8,  285),
  ('00000000-0000-0000-0000-000000000026','232026789', NULL,     'CONSTANCY',        'MYAB6','United Kingdom','GB','Fishing Vessel', 20,  6,   88),
  ('00000000-0000-0000-0000-000000000027','250027890','9789012', 'PADRAIG PEARSE',   'EIMG7','Ireland',       'IE','Fishing Vessel', 28,  7,  205),
  ('00000000-0000-0000-0000-000000000028','232028901','9890012', 'ENDEAVOUR',        'MYCD8','United Kingdom','GB','Fishing Vessel', 38, 10,  445),
  ('00000000-0000-0000-0000-000000000029','244029012', NULL,     'CORNELIS VROLIJK', 'PCCZ9','Netherlands',   'NL','Fishing Vessel', 83, 17, 4194),
  ('00000000-0000-0000-0000-000000000030','232030123','9012340', 'ARDENT',           'MYEF0','United Kingdom','GB','Fishing Vessel', 28,  7,  195),
  ('00000000-0000-0000-0000-000000000031','232031234', NULL,     'PERSEVERANCE',     'MYGH1','United Kingdom','GB','Fishing Vessel', 16,  5,   52),
  ('00000000-0000-0000-0000-000000000032','232032345','9123401', 'HARVEST REAPER',   'MYIJ2','United Kingdom','GB','Fishing Vessel', 34,  9,  325),
  ('00000000-0000-0000-0000-000000000033','235033456', NULL,     'PATHFINDER',       'MYKL3','United Kingdom','GB','Fishing Vessel', 22,  6,  118),
  ('00000000-0000-0000-0000-000000000034','227034567','9234501', 'BRETAGNE NORD',    'FZBA4','France',        'FR','Fishing Vessel', 32,  8,  278),
  ('00000000-0000-0000-0000-000000000035','232035678', NULL,     'NAVIGATOR',        'MYMN5','United Kingdom','GB','Fishing Vessel', 18,  5,   68),
  ('00000000-0000-0000-0000-000000000036','232036789','9345601', 'PATHMAKER',        'MYOP6','United Kingdom','GB','Fishing Vessel', 42, 11,  558),
  ('00000000-0000-0000-0000-000000000037','250037890', NULL,     'ÁINE NÍ BHRIAIN', 'EIMH7','Ireland',       'IE','Fishing Vessel', 24,  7,  168),
  ('00000000-0000-0000-0000-000000000038','232038901','9456701', 'RESOLUTE',         'MYQR8','United Kingdom','GB','Fishing Vessel', 26,  7,  178),
  ('00000000-0000-0000-0000-000000000039','257039012','9567801', 'POLARFANGST',      'LMBE9','Norway',        'NO','Fishing Vessel', 55, 13,  840),
  ('00000000-0000-0000-0000-000000000040','232040123', NULL,     'KINGFISHER',       'MYST0','United Kingdom','GB','Fishing Vessel', 12,  4,   28)
ON CONFLICT (mmsi) DO NOTHING;


INSERT INTO public.positions
    (vessel_id, mmsi, latitude, longitude, speed_over_ground, course_over_ground, heading, nav_status, destination, draught)
VALUES
  ('00000000-0000-0000-0000-000000000001','232001234', 57.820, -3.450,  4.2, 135, 138,'fishing',         'PETERHEAD',       3.8),
  ('00000000-0000-0000-0000-000000000002','232002345', 58.140, -2.880,  6.1, 220, 218,'underway_engine',  'FRASERBURGH',     3.2),
  ('00000000-0000-0000-0000-000000000003','232003456', 56.480, -2.100,  0.3,  45,  48,'at_anchor',        'ARBROATH',        4.1),
  ('00000000-0000-0000-0000-000000000004','235004567', 54.320, -0.410,  5.8,  60,  62,'fishing',         'SCARBOROUGH',     2.9),
  ('00000000-0000-0000-0000-000000000005','232005678', 51.680,  1.280,  3.6, 180, 177,'fishing',         'HARWICH',         2.4),
  ('00000000-0000-0000-0000-000000000006','244006789', 52.900,  2.850,  7.2, 275, 273,'underway_engine',  'SCHEVENINGEN',    4.8),
  ('00000000-0000-0000-0000-000000000007','244007890', 53.680,  3.120,  6.8, 300, 302,'fishing',         'DEN HELDER',      5.1),
  ('00000000-0000-0000-0000-000000000008','246008901', 53.120,  4.450,  0.1,  90,  90,'moored',          'URK',             5.5),
  ('00000000-0000-0000-0000-000000000009','257009012', 60.140,  1.880,  8.4, 155, 158,'underway_engine',  'ABERDEEN',        5.8),
  ('00000000-0000-0000-0000-000000000010','257010123', 61.320,  0.550,  9.1, 200, 202,'underway_engine',  'LERWICK',         6.2),
  ('00000000-0000-0000-0000-000000000011','250011234', 52.220, -6.350,  4.5,  90,  88,'fishing',         'WEXFORD',         3.5),
  ('00000000-0000-0000-0000-000000000012','250012345', 51.850,-10.120,  7.8,  45,  47,'underway_engine',  'CASTLETOWNBERE',  4.2),
  ('00000000-0000-0000-0000-000000000013','227013456', 49.420, -4.850,  5.5, 330, 328,'fishing',         'BREST',           4.4),
  ('00000000-0000-0000-0000-000000000014','227014567', 50.080, -1.220,  6.2,  15,  17,'underway_engine',  'CHERBOURG',       3.8),
  ('00000000-0000-0000-0000-000000000015','232015678', 55.920, -2.180,  3.8,  95,  97,'fishing',         'EYEMOUTH',        2.8),
  ('00000000-0000-0000-0000-000000000016','232016789', 50.380, -4.150,  4.1, 240, 242,'fishing',         'PLYMOUTH',        2.2),
  ('00000000-0000-0000-0000-000000000017','235017890', 57.280, -5.780,  5.2, 165, 168,'fishing',         'MALLAIG',         3.6),
  ('00000000-0000-0000-0000-000000000018','232018901', 51.420,  1.320,  0.2, 180, 180,'moored',          'RAMSGATE',        1.8),
  ('00000000-0000-0000-0000-000000000019','232019012', 52.550,  1.720,  6.6, 110, 113,'underway_engine',  'LOWESTOFT',       3.1),
  ('00000000-0000-0000-0000-000000000020','224020123', 48.550, -8.120, 10.2,  15,  17,'underway_engine',  'VIGO',            6.5),
  ('00000000-0000-0000-0000-000000000021','232021234', 53.350, -4.620,  4.8, 315, 318,'fishing',         'HOLYHEAD',        3.0),
  ('00000000-0000-0000-0000-000000000022','232022345', 50.880, -1.080,  5.5, 195, 197,'underway_engine',  'SOUTHAMPTON',     3.3),
  ('00000000-0000-0000-0000-000000000023','248023456', 50.120,  2.450,  8.8, 255, 257,'underway_engine',  'DOVER',           4.5),
  ('00000000-0000-0000-0000-000000000024','232024567', 53.820,  0.280,  3.2,  70,  73,'fishing',         'BRIDLINGTON',     2.5),
  ('00000000-0000-0000-0000-000000000025','235025678', 59.120, -2.950,  5.8,  25,  27,'fishing',         'KIRKWALL',        4.0),
  ('00000000-0000-0000-0000-000000000026','232026789', 60.420, -0.880,  4.4, 145, 147,'fishing',         'LERWICK',         2.7),
  ('00000000-0000-0000-0000-000000000027','250027890', 53.320, -9.920,  6.2, 275, 278,'underway_engine',  'GALWAY',          3.7),
  ('00000000-0000-0000-0000-000000000028','232028901', 57.950, -5.450,  7.4, 335, 337,'underway_engine',  'STORNOWAY',       5.0),
  ('00000000-0000-0000-0000-000000000029','244029012', 55.420,  4.180, 11.2, 190, 192,'underway_engine',  'IJMUIDEN',        7.8),
  ('00000000-0000-0000-0000-000000000030','232030123', 56.720, -3.880,  5.1,  50,  52,'fishing',         'MONTROSE',        3.5),
  ('00000000-0000-0000-0000-000000000031','232031234', 50.680, -3.480,  3.5, 210, 213,'fishing',         'BRIXHAM',         2.2),
  ('00000000-0000-0000-0000-000000000032','232032345', 56.180, -6.880,  5.8, 120, 122,'fishing',         'CAMPBELTOWN',     4.1),
  ('00000000-0000-0000-0000-000000000033','235033456', 54.580, -3.420,  4.2, 285, 287,'fishing',         'WHITEHAVEN',      3.0),
  ('00000000-0000-0000-0000-000000000034','227034567', 48.280, -5.650,  6.8,  25,  28,'underway_engine',  'ROSCOFF',         4.0),
  ('00000000-0000-0000-0000-000000000035','232035678', 51.920, -5.080,  3.8, 345, 347,'fishing',         'MILFORD HAVEN',   2.4),
  ('00000000-0000-0000-0000-000000000036','232036789', 58.820, -4.450,  8.2, 175, 177,'underway_engine',  'WICK',            5.6),
  ('00000000-0000-0000-0000-000000000037','250037890', 54.480,-10.120,  5.5,  95,  97,'fishing',         'KILLYBEGS',       3.2),
  ('00000000-0000-0000-0000-000000000038','232038901', 51.120, -1.420,  0.1,   0,   0,'at_anchor',        'SOUTHAMPTON',     3.4),
  ('00000000-0000-0000-0000-000000000039','257039012', 62.120, -1.450, 11.8, 170, 172,'underway_engine',  'BERGEN',          6.8),
  ('00000000-0000-0000-0000-000000000040','232040123', 50.820,  0.580,  3.1, 155, 158,'fishing',         'EASTBOURNE',      1.5);


-- =============================================================================
-- DONE
-- You should now see 40 rows in vessels and 40 rows in positions.
-- Verify with:
--   SELECT COUNT(*) FROM public.vessels;
--   SELECT COUNT(*) FROM public.positions;
--   SELECT * FROM public.vessel_current_positions LIMIT 5;
-- =============================================================================

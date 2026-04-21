/**
 * Data access layer for TrawlerWatch.
 *
 * To switch from mock data to live Supabase, set:
 *   NEXT_PUBLIC_USE_LIVE_DATA=true
 * in your .env.local file.
 *
 * The data shape returned is identical in both modes —
 * no frontend component ever needs to know which source is active.
 */

import { VesselWithPosition, FilterState } from "@/types";
import { vesselTypeGroup } from "@/lib/vesselTypes";
import { MOCK_VESSELS } from "./mockData";

const USE_LIVE = process.env.NEXT_PUBLIC_USE_LIVE_DATA === "true";

// ── Live Supabase path ────────────────────────────────────────────────────────

async function fetchFromSupabase(): Promise<VesselWithPosition[]> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from("vessels")
    .select(`*, latest_position:positions!inner(*)`);

  if (error) throw new Error(error.message);
  return (data as VesselWithPosition[]) ?? [];
}

async function fetchTrailFromSupabase(
  vesselId: string,
): Promise<VesselWithPosition["trail"]> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("vessel_id", vesselId)
    .order("timestamp", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllVessels(): Promise<VesselWithPosition[]> {
  if (USE_LIVE) return fetchFromSupabase();
  await new Promise((r) => setTimeout(r, 150)); // simulate latency in dev
  return MOCK_VESSELS;
}

export async function getVesselTrail(
  vesselId: string,
): Promise<VesselWithPosition["trail"]> {
  if (USE_LIVE) return fetchTrailFromSupabase(vesselId);
  return MOCK_VESSELS.find((v) => v.id === vesselId)?.trail ?? [];
}

// ── Client-side filtering ─────────────────────────────────────────────────────

export function filterVessels(
  vessels: VesselWithPosition[],
  filters: FilterState,
): VesselWithPosition[] {
  const now      = Date.now();
  const cutoffMs = filters.lastUpdateHours * 60 * 60 * 1000;

  return vessels.filter((v) => {
    const pos = v.latest_position;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hit =
        v.name.toLowerCase().includes(q) ||
        v.mmsi.includes(q) ||
        (v.callsign?.toLowerCase().includes(q) ?? false) ||
        (v.imo?.includes(q) ?? false);
      if (!hit) return false;
    }

    if (filters.flag && v.flag !== filters.flag) return false;

    const spd = pos.speed_over_ground;
    if (spd < filters.speedMin || spd > filters.speedMax) return false;

    if (filters.navStatus && pos.nav_status !== filters.navStatus) return false;

    if (filters.vesselType && vesselTypeGroup(v.vessel_type) !== filters.vesselType) return false;

    if (Date.now() - new Date(pos.timestamp).getTime() > cutoffMs) return false;

    if (filters.activeOnly && spd <= 0.5) return false;

    return true;
  });
}

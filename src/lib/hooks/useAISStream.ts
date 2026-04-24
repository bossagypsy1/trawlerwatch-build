"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VesselWithPosition, NavStatus, Position } from "@/types";

// Reads current vessel state from the backend, which sources it from Neon.
// No vessel accumulation happens in the browser — the backend is the sole
// source of truth and the hook simply replaces state on each poll.
const VESSELS_URL    = "/api/vessels";
const POLL_INTERVAL_MS = 5_000;

// ── AIS wire shape (returned by aisstream /vessels) ────────────────────────

interface AISUpdate {
  mmsi:        string;
  shipName:    string | null;
  messageType: string;
  latitude:    number | null;
  longitude:   number | null;
  speed:       number | null;
  course:      number | null;
  heading:     number | null;
  navStatus:   string | null;
  timestamp:   string;
  callsign:    string | null;
  imo:         string | null;
  vesselType:  string | null;
  lengthM:     number | null;
  widthM:      number | null;
  draught:     number | null;
  destination: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalise Go-style AISStream timestamp → ISO string JS Date can parse.
 * Input:  "2026-04-14 22:27:22.223962632 +0000 UTC"
 * Output: "2026-04-14T22:27:22.223Z"
 */
function normaliseTimestamp(ts: string): string {
  return ts
    .replace(" ", "T")
    .replace(/(\.\d{3})\d*/, "$1")
    .replace(/\s+\+0000\s+UTC$/, "Z")
    .replace(/\s+\+0000$/, "Z");
}

function mapNavStatus(raw: string | null): NavStatus {
  switch (raw) {
    case "Under way (engine)":         return "underway_engine";
    case "At anchor":                  return "at_anchor";
    case "Not under command":          return "not_under_command";
    case "Restricted maneuverability": return "restricted_manoeuvrability";
    case "Constrained by draught":     return "constrained_draught";
    case "Moored":                     return "moored";
    case "Aground":                    return "aground";
    case "Fishing":                    return "fishing";
    case "Under way (sailing)":        return "underway_sailing";
    default:                           return "unknown";
  }
}

/**
 * Pure transform: one AISUpdate → VesselWithPosition.
 * Returns null for records without a position fix (static-only rows that
 * somehow lack lat/lon — shouldn't happen given the Neon query filters them,
 * but kept as a safety guard).
 */
function transformVessel(u: AISUpdate): VesselWithPosition | null {
  if (u.latitude == null || u.longitude == null) return null;

  const ts  = normaliseTimestamp(u.timestamp);
  const pos: Position = {
    id:                 `${u.mmsi}_${ts}`,
    vessel_id:          u.mmsi,
    mmsi:               u.mmsi,
    latitude:           u.latitude,
    longitude:          u.longitude,
    speed_over_ground:  u.speed   ?? 0,
    course_over_ground: u.course  ?? 0,
    heading:            u.heading ?? 511,
    nav_status:         mapNavStatus(u.navStatus),
    destination:        u.destination ?? null,
    draught:            u.draught     ?? null,
    timestamp:          ts,
  };

  return {
    id:            u.mmsi,
    mmsi:          u.mmsi,
    name:          (u.shipName && u.shipName !== "—") ? u.shipName : "—",
    flag:          "",
    flag_code:     "",
    vessel_type:   u.vesselType  ?? null,
    callsign:      u.callsign    ?? null,
    imo:           u.imo         ?? null,
    length_m:      u.lengthM     ?? null,
    width_m:       u.widthM      ?? null,
    gross_tonnage: null,
    created_at:    ts,
    latest_position: pos,
    trail:         [],   // track history not yet stored; will be re-enabled when added
  };
}

// ── Public hook ────────────────────────────────────────────────────────────

export interface AISStreamState {
  vessels:       VesselWithPosition[];
  connected:     boolean;
  totalReceived: number;
  loading:       boolean;
}

export function useAISStream(): AISStreamState {
  const lastLocaleId = useRef<string | null>(null);

  const [state, setState] = useState<AISStreamState>({
    vessels:       [],
    connected:     false,
    totalReceived: 0,
    loading:       true,
  });

  const poll = useCallback(async () => {
    try {
      const res = await fetch(VESSELS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: {
        connected:     boolean;
        totalReceived: number;
        localeId?:     string;
        messages:      AISUpdate[];
      } = await res.json();

      // Track locale changes for parent components that react to them
      if (data.localeId && data.localeId !== lastLocaleId.current) {
        lastLocaleId.current = data.localeId;
      }

      // Backend already holds fully merged state per MMSI — just transform and replace.
      const vessels = data.messages
        .map(transformVessel)
        .filter((v): v is VesselWithPosition => v !== null);

      setState({
        vessels,
        connected:     data.connected,
        totalReceived: data.totalReceived ?? 0,
        loading:       false,
      });
    } catch {
      setState((prev) => ({ ...prev, connected: false }));
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  return state;
}

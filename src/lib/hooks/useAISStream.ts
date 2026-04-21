"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VesselWithPosition, NavStatus, Position } from "@/types";

const STATUS_URL = "/api/ais-status";
const POLL_INTERVAL_MS = 2_000;
const MAX_TRAIL        = 20;

// ── AIS wire shape ─────────────────────────────────────────────────────────────

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
  // From ShipStaticData
  callsign:    string | null;
  imo:         string | null;
  vesselType:  string | null;
  lengthM:     number | null;
  widthM:      number | null;
  draught:     number | null;
  destination: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Normalise the Go-style timestamp from AISStream into a string that
 * JavaScript's Date constructor can parse reliably.
 * Input:  "2026-04-14 22:27:22.223962632 +0000 UTC"
 * Output: "2026-04-14T22:27:22.223Z"
 */
function normaliseTimestamp(ts: string): string {
  return ts
    .replace(" ", "T")                // date/time separator
    .replace(/(\.\d{3})\d*/, "$1")    // truncate sub-ms precision
    .replace(/\s+\+0000\s+UTC$/, "Z") // timezone suffix
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

function makePosition(u: AISUpdate): Position {
  return {
    id:                 `${u.mmsi}_${u.timestamp}`,
    vessel_id:          u.mmsi,
    mmsi:               u.mmsi,
    latitude:           u.latitude!,
    longitude:          u.longitude!,
    speed_over_ground:  u.speed   ?? 0,
    course_over_ground: u.course  ?? 0,
    heading:            u.heading ?? 511,
    nav_status:         mapNavStatus(u.navStatus),
    destination:        null,
    draught:            null,
    timestamp:          normaliseTimestamp(u.timestamp),
  };
}

function upsert(map: Map<string, VesselWithPosition>, u: AISUpdate): void {
  const prev = map.get(u.mmsi);

  // ShipStaticData has no position — merge metadata into existing vessel only
  if (u.latitude == null || u.longitude == null) {
    if (prev) {
      map.set(u.mmsi, {
        ...prev,
        name:        (u.shipName && u.shipName !== "—") ? u.shipName : prev.name,
        vessel_type: u.vesselType ?? prev.vessel_type,
        callsign:    u.callsign   ?? prev.callsign,
        imo:         u.imo        ?? prev.imo,
        length_m:    u.lengthM    ?? prev.length_m,
        width_m:     u.widthM     ?? prev.width_m,
        latest_position: {
          ...prev.latest_position,
          destination: u.destination ?? prev.latest_position.destination,
          draught:     u.draught     ?? prev.latest_position.draught,
        },
      });
    }
    return;
  }

  const newPos = makePosition(u);
  // Only extend trail if the vessel has actually moved (avoids duplicate entries
  // now that /status returns one merged record per MMSI on every poll)
  const positionChanged = !prev
    || prev.latest_position.latitude  !== newPos.latitude
    || prev.latest_position.longitude !== newPos.longitude;
  const trail: Position[] = (prev && positionChanged)
    ? [prev.latest_position, ...(prev.trail ?? [])].slice(0, MAX_TRAIL)
    : (prev?.trail ?? []);

  map.set(u.mmsi, {
    id:            u.mmsi,
    mmsi:          u.mmsi,
    name:          (u.shipName && u.shipName !== "—") ? u.shipName : (prev?.name ?? "—"),
    flag:          prev?.flag          ?? "",
    flag_code:     prev?.flag_code     ?? "",
    vessel_type:   u.vesselType  ?? prev?.vessel_type   ?? null,
    callsign:      u.callsign    ?? prev?.callsign      ?? null,
    imo:           u.imo         ?? prev?.imo            ?? null,
    length_m:      u.lengthM     ?? prev?.length_m      ?? null,
    width_m:       u.widthM      ?? prev?.width_m       ?? null,
    gross_tonnage: prev?.gross_tonnage ?? null,
    created_at:    prev?.created_at    ?? new Date().toISOString(),
    latest_position: {
      ...newPos,
      destination: u.destination ?? prev?.latest_position.destination ?? null,
      draught:     u.draught     ?? prev?.latest_position.draught     ?? null,
    },
    trail,
  });
}

// ── Public hook ────────────────────────────────────────────────────────────────

export interface AISStreamState {
  vessels:       VesselWithPosition[];
  connected:     boolean;
  totalReceived: number;
  loading:       boolean;
}

export function useAISStream(): AISStreamState {
  const vesselMap = useRef(new Map<string, VesselWithPosition>());

  const [state, setState] = useState<AISStreamState>({
    vessels:       [],
    connected:     false,
    totalReceived: 0,
    loading:       true,
  });

  const poll = useCallback(async () => {
    try {
      const res = await fetch(STATUS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: { connected: boolean; totalReceived: number; messages: AISUpdate[] } =
        await res.json();

      for (const u of data.messages) {
        upsert(vesselMap.current, u);
      }

      setState({
        vessels:       Array.from(vesselMap.current.values()),
        connected:     data.connected,
        totalReceived: data.totalReceived,
        loading:       false,
      });
    } catch {
      setState((prev) => ({ ...prev, connected: false }));
    }
  }, []);

  useEffect(() => {
    poll(); // immediate first fetch
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  return state;
}

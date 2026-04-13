import { NavStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";

export function formatAge(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return "unknown";
  }
}

export function formatSpeed(knots: number): string {
  return `${knots.toFixed(1)} kn`;
}

export function formatCourse(deg: number): string {
  return `${Math.round(deg)}°`;
}

export function formatHeading(deg: number): string {
  if (deg === 511) return "N/A";
  return `${Math.round(deg)}°`;
}

export function compassPoint(deg: number): string {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return dirs[Math.round(deg / 22.5) % 16];
}

export const NAV_STATUS_COLOR: Record<NavStatus, string> = {
  underway_engine:            "#00ff88",
  at_anchor:                  "#ffb800",
  not_under_command:          "#ff3b3b",
  restricted_manoeuvrability: "#ff8c00",
  constrained_draught:        "#ff6b6b",
  moored:                     "#4a90c4",
  aground:                    "#ff3b3b",
  fishing:                    "#00c8ff",
  underway_sailing:           "#00ff88",
  reserved:                   "#888888",
  unknown:                    "#888888",
};

export const NAV_STATUS_LABEL: Record<NavStatus, string> = {
  underway_engine:            "Underway",
  at_anchor:                  "At Anchor",
  not_under_command:          "NUC",
  restricted_manoeuvrability: "Restricted",
  constrained_draught:        "Constrained",
  moored:                     "Moored",
  aground:                    "Aground",
  fishing:                    "Fishing",
  underway_sailing:           "Sailing",
  reserved:                   "Reserved",
  unknown:                    "Unknown",
};

export function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  const offset = 0x1f1e6 - 65;
  return String.fromCodePoint(
    code.toUpperCase().charCodeAt(0) + offset,
    code.toUpperCase().charCodeAt(1) + offset,
  );
}

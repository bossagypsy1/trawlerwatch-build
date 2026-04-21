// Full ITU/IMO AIS vessel type code lookup and grouping utilities

// ---------------------------------------------------------------------------
// Code → label (complete 0–99 table)
// ---------------------------------------------------------------------------

export const VESSEL_TYPE_LABELS: Record<number, string> = {
  0:  "Not available",
  // 1–19: reserved
  20: "Wing in ground (WIG)",
  21: "WIG — Hazardous A",
  22: "WIG — Hazardous B",
  23: "WIG — Hazardous C",
  24: "WIG — Hazardous D",
  // 25–29: reserved
  30: "Fishing",
  31: "Towing",
  32: "Towing (large)",
  33: "Dredging / underwater ops",
  34: "Diving ops",
  35: "Military ops",
  36: "Sailing",
  37: "Pleasure craft",
  // 38–39: reserved
  40: "High-speed craft (HSC)",
  41: "HSC — Hazardous A",
  42: "HSC — Hazardous B",
  43: "HSC — Hazardous C",
  44: "HSC — Hazardous D",
  // 45–49: reserved
  50: "Pilot vessel",
  51: "Search and rescue",
  52: "Tug",
  53: "Port tender",
  54: "Anti-pollution",
  55: "Law enforcement",
  56: "Spare (unclassified)",
  57: "Medical transport",
  58: "Ship per RR",
  59: "Special craft",
  60: "Passenger",
  61: "Passenger — Hazardous A",
  62: "Passenger — Hazardous B",
  63: "Passenger — Hazardous C",
  64: "Passenger — Hazardous D",
  // 65–69: reserved
  70: "Cargo",
  71: "Cargo — Hazardous A",
  72: "Cargo — Hazardous B",
  73: "Cargo — Hazardous C",
  74: "Cargo — Hazardous D",
  // 75–79: reserved
  80: "Tanker",
  81: "Tanker — Hazardous A",
  82: "Tanker — Hazardous B",
  83: "Tanker — Hazardous C",
  84: "Tanker — Hazardous D",
  // 85–89: reserved
  90: "Other",
  91: "Other — Hazardous A",
  92: "Other — Hazardous B",
  93: "Other — Hazardous C",
  94: "Other — Hazardous D",
  // 95–98: reserved
  99: "Unknown",
};

// ---------------------------------------------------------------------------
// Groups — coarse categories used for colour coding and filters
// ---------------------------------------------------------------------------

export type VesselTypeGroup =
  | "fishing"
  | "cargo"
  | "tanker"
  | "passenger"
  | "service"
  | "pleasure"
  | "highspeed"
  | "towing"
  | "wig"
  | "special"
  | "other"
  | "unknown";

export const VESSEL_TYPE_GROUP_LABEL: Record<VesselTypeGroup, string> = {
  fishing:   "Fishing",
  cargo:     "Cargo",
  tanker:    "Tanker",
  passenger: "Passenger",
  service:   "Service / SAR",
  pleasure:  "Pleasure / Sailing",
  highspeed: "High-speed (HSC)",
  towing:    "Towing",
  wig:       "Wing in Ground",
  special:   "Special / Military",
  other:     "Other",
  unknown:   "Unknown",
};

// Marker / legend colours — one per group
export const VESSEL_TYPE_GROUP_COLOR: Record<VesselTypeGroup, string> = {
  fishing:   "#00c8ff",   // cyan
  cargo:     "#00e676",   // green
  tanker:    "#ff5252",   // red
  passenger: "#e040fb",   // magenta
  service:   "#ffd740",   // amber
  pleasure:  "#40c4ff",   // sky blue
  highspeed: "#ff9100",   // orange
  towing:    "#b388ff",   // purple
  wig:       "#80d8ff",   // light cyan
  special:   "#ff6e40",   // deep orange
  other:     "#aaaaaa",   // light grey
  unknown:   "#888888",   // grey
};

// Groups shown in the map legend (most common, ordered by frequency)
export const LEGEND_GROUPS: VesselTypeGroup[] = [
  "cargo",
  "tanker",
  "passenger",
  "fishing",
  "service",
  "pleasure",
  "towing",
  "highspeed",
  "special",
  "other",
  "unknown",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a raw vessel_type string (e.g. "70") to its display group. */
export function vesselTypeGroup(code: string | null | undefined): VesselTypeGroup {
  if (!code) return "unknown";
  const n = parseInt(code, 10);
  if (isNaN(n)) return "unknown";
  if (n === 30)             return "fishing";
  if (n === 31 || n === 32) return "towing";
  if (n >= 33 && n <= 35)   return "special";
  if (n === 36 || n === 37) return "pleasure";
  if (n >= 20 && n <= 29)   return "wig";
  if (n >= 40 && n <= 49)   return "highspeed";
  if (n >= 50 && n <= 59)   return "service";
  if (n >= 60 && n <= 69)   return "passenger";
  if (n >= 70 && n <= 79)   return "cargo";
  if (n >= 80 && n <= 89)   return "tanker";
  if (n >= 90 && n <= 99)   return "other";
  return "unknown";
}

/** Decode a raw type code to a human-readable label, e.g. "70" → "Cargo". */
export function vesselTypeLabel(code: string | null | undefined): string {
  if (!code) return "—";
  const n = parseInt(code, 10);
  if (isNaN(n)) return code;
  return VESSEL_TYPE_LABELS[n] ?? `Type ${n}`;
}

/** Return the hex colour for a raw type code. */
export function vesselTypeColor(code: string | null | undefined): string {
  return VESSEL_TYPE_GROUP_COLOR[vesselTypeGroup(code)];
}

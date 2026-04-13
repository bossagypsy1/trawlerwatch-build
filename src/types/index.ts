// Core vessel — mirrors the Supabase 'vessels' table
export interface Vessel {
  id: string;
  mmsi: string;
  imo?: string | null;
  name: string;
  callsign?: string | null;
  flag: string;
  flag_code: string;
  vessel_type: string;
  length_m?: number | null;
  width_m?: number | null;
  gross_tonnage?: number | null;
  created_at: string;
}

// Position record — mirrors the Supabase 'positions' table
export interface Position {
  id: string;
  vessel_id: string;
  mmsi: string;
  latitude: number;
  longitude: number;
  speed_over_ground: number;  // knots
  course_over_ground: number; // degrees 0–359
  heading: number;            // degrees 0–359, or 511 = not available
  nav_status: NavStatus;
  destination?: string | null;
  draught?: number | null;
  timestamp: string;
}

// Joined type used throughout the UI
export interface VesselWithPosition extends Vessel {
  latest_position: Position;
  trail?: Position[];
}

export type NavStatus =
  | "underway_engine"
  | "at_anchor"
  | "not_under_command"
  | "restricted_manoeuvrability"
  | "constrained_draught"
  | "moored"
  | "aground"
  | "fishing"
  | "underway_sailing"
  | "reserved"
  | "unknown";

export const NAV_STATUS_LABELS: Record<NavStatus, string> = {
  underway_engine:            "Underway (Engine)",
  at_anchor:                  "At Anchor",
  not_under_command:          "Not Under Command",
  restricted_manoeuvrability: "Restricted Manoeuvrability",
  constrained_draught:        "Constrained by Draught",
  moored:                     "Moored",
  aground:                    "Aground",
  fishing:                    "Fishing",
  underway_sailing:           "Underway (Sailing)",
  reserved:                   "Reserved",
  unknown:                    "Unknown",
};

export interface FilterState {
  search: string;
  flag: string;
  speedMin: number;
  speedMax: number;
  navStatus: NavStatus | "";
  lastUpdateHours: number;
  showTrails: boolean;
  activeOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  flag: "",
  speedMin: 0,
  speedMax: 20,
  navStatus: "",
  lastUpdateHours: 24,
  showTrails: true,
  activeOnly: false,
};

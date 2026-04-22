"use client";

import { VesselWithPosition } from "@/types";
import { NAV_STATUS_COLOR } from "@/lib/utils";

interface Props { vessels: VesselWithPosition[]; }

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center px-2">
      <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[9px] text-ocean-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-ocean-700/60 mx-1" />;
}

export default function StatsBar({ vessels }: Props) {
  const total    = vessels.length;
  const fishing  = vessels.filter((v) => v.latest_position.nav_status === "fishing").length;
  const underway = vessels.filter((v) =>
    ["underway_engine", "underway_sailing"].includes(v.latest_position.nav_status),
  ).length;
  const anchored = vessels.filter((v) =>
    ["at_anchor", "moored"].includes(v.latest_position.nav_status),
  ).length;
  const flags = new Set(vessels.map((v) => v.flag_code)).size;

  return (
    <div
      className="flex items-center gap-1
        bg-ocean-900/90 backdrop-blur-sm border border-ocean-700/50
        rounded-lg px-3 py-2 shadow-xl pointer-events-none"
    >
      <Stat label="Total"    value={total}    color="#ffffff"                            />
      <Divider />
      <Stat label="Fishing"  value={fishing}  color={NAV_STATUS_COLOR.fishing}           />
      <Divider />
      <Stat label="Underway" value={underway} color={NAV_STATUS_COLOR.underway_engine}   />
      <Divider />
      <Stat label="Anchored" value={anchored} color={NAV_STATUS_COLOR.at_anchor}         />
      <Divider />
      <Stat label="Flags"    value={flags}    color="#9bb5c8"                            />
    </div>
  );
}

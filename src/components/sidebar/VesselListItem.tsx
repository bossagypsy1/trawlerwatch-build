"use client";

import { VesselWithPosition } from "@/types";
import {
  NAV_STATUS_COLOR,
  NAV_STATUS_LABEL,
  flagEmoji,
  formatSpeed,
  formatAge,
} from "@/lib/utils";

interface Props {
  vessel:     VesselWithPosition;
  isSelected: boolean;
  onClick:    () => void;
}

export default function VesselListItem({ vessel, isSelected, onClick }: Props) {
  const pos         = vessel.latest_position;
  const statusColor = NAV_STATUS_COLOR[pos.nav_status] ?? "#888888";
  const statusLabel = NAV_STATUS_LABEL[pos.nav_status] ?? "Unknown";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 border ${
        isSelected
          ? "bg-ocean-700/60 border-ocean-500/60"
          : "bg-transparent border-transparent hover:bg-ocean-800/60 hover:border-ocean-700/40"
      }`}
    >
      {/* Name row */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm shrink-0">{flagEmoji(vessel.flag_code)}</span>
          <span className="text-xs font-semibold text-white truncate font-display">
            {vessel.name}
          </span>
        </div>
        <div
          className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: `${statusColor}1a`, color: statusColor }}
        >
          {statusLabel}
        </div>
      </div>

      {/* Detail row */}
      <div className="flex items-center justify-between text-[10px] text-ocean-400 font-mono">
        <span>{vessel.mmsi}</span>
        <span className="flex items-center gap-2">
          <span className="text-ocean-300">{formatSpeed(pos.speed_over_ground)}</span>
          <span className="text-ocean-500">{formatAge(pos.timestamp)}</span>
        </span>
      </div>
    </button>
  );
}

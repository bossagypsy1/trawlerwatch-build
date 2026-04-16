"use client";

import { VesselWithPosition } from "@/types";
import {
  NAV_STATUS_COLOR,
  NAV_STATUS_LABEL,
  flagEmoji,
  formatSpeed,
  formatAge,
  formatCourse,
  formatHeading,
  compassPoint,
} from "@/lib/utils";
import { X, Navigation, Ship, Clock, MapPin } from "lucide-react";

interface Props {
  vessel:  VesselWithPosition;
  onClose: () => void;
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-ocean-700/40 last:border-0">
      <span className="text-xs text-ocean-400 shrink-0">{label}</span>
      <span
        className={`text-xs text-right ${mono ? "font-mono" : ""} text-black font-medium max-w-[60%] break-all`}
      >
        {value}
      </span>
    </div>
  );
}

export default function VesselDetail({ vessel, onClose }: Props) {
  const pos         = vessel.latest_position;
  const statusColor = NAV_STATUS_COLOR[pos.nav_status] ?? "#888888";
  const statusLabel = NAV_STATUS_LABEL[pos.nav_status] ?? "Unknown";
  const heading     = pos.heading === 511 ? pos.course_over_ground : pos.heading;

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-ocean-700/50 bg-ocean-800/50 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{flagEmoji(vessel.flag_code)}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold"
                style={{
                  backgroundColor: `${statusColor}22`,
                  color:            statusColor,
                  border:          `1px solid ${statusColor}44`,
                }}
              >
                {statusLabel}
              </span>
            </div>
            <h2 className="text-base font-bold font-display leading-tight">
              <button
                onClick={() => window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(vessel.name + ' ' + vessel.mmsi + ' vessel')}`,
                  '_blank'
                )}
                className="text-signal-blue hover:underline hover:text-signal-blue/80 transition-colors text-left"
                title="Search for this vessel"
              >
                {vessel.name}
              </button>
            </h2>
            <p className="text-xs text-ocean-300 font-mono mt-0.5">MMSI: {vessel.mmsi}</p>
          </div>
          <button
            onClick={onClose}
            className="text-ocean-400 hover:text-white transition-colors shrink-0 p-1 rounded hover:bg-ocean-700/50"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-white/95">

        {/* SOG / Compass point / Mini compass */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-ocean-800/60 rounded-lg p-3 text-center border border-ocean-700/40">
            <div className="text-lg font-bold font-mono" style={{ color: statusColor }}>
              {pos.speed_over_ground.toFixed(1)}
            </div>
            <div className="text-[10px] text-ocean-400 uppercase tracking-wider mt-0.5">kn SOG</div>
          </div>

          <div className="bg-ocean-800/60 rounded-lg p-3 text-center border border-ocean-700/40">
            <div className="text-lg font-bold font-mono text-white/90">
              {compassPoint(heading)}
            </div>
            <div className="text-[10px] text-ocean-400 uppercase tracking-wider mt-0.5">
              {formatCourse(heading)}
            </div>
          </div>

          <div className="bg-ocean-800/60 rounded-lg p-3 text-center border border-ocean-700/40">
            <div className="w-8 h-8 mx-auto relative">
              <div
                className="absolute inset-0 rounded-full border border-ocean-600"
                style={{ background: "radial-gradient(circle, #0a2540 0%, #041020 100%)" }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${heading}deg)` }}
              >
                <div
                  className="w-0.5 h-3 rounded-full"
                  style={{
                    background: "linear-gradient(to bottom, #ff3b3b, #4a90c4)",
                    marginTop:  "-2px",
                  }}
                />
              </div>
            </div>
            <div className="text-[10px] text-ocean-400 uppercase tracking-wider mt-1">HDG</div>
          </div>
        </div>

        {/* Position */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ocean-400 mb-2">
            <MapPin size={10} /> Position
          </div>
          <div className="bg-ocean-800/40 rounded-lg p-3 font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-ocean-400">LAT</span>
              <span className="text-white/90">{pos.latitude.toFixed(5)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ocean-400">LON</span>
              <span className="text-white/90">{pos.longitude.toFixed(5)}°</span>
            </div>
          </div>
        </div>

        {/* Vessel identity */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ocean-400 mb-2">
            <Ship size={10} /> Vessel
          </div>
          <div className="space-y-0">
            <Row label="Vessel Type" value={vessel.vessel_type ?? "—"} mono />
            <Row label="Callsign"   value={vessel.callsign    ?? "—"} mono />
            <Row label="IMO"        value={vessel.imo         ?? "—"} mono />
            <Row label="Length"     value={vessel.length_m    != null ? `${vessel.length_m} m` : "—"} mono />
            <Row label="Width"      value={vessel.width_m     != null ? `${vessel.width_m} m`  : "—"} mono />
          </div>
        </div>

        {/* Navigation */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ocean-400 mb-2">
            <Navigation size={10} /> Navigation
          </div>
          <div className="space-y-0">
            <Row
              label="Status"
              value={<span style={{ color: statusColor }}>{statusLabel}</span>}
            />
            <Row
              label="COG"
              value={`${formatCourse(pos.course_over_ground)} ${compassPoint(pos.course_over_ground)}`}
              mono
            />
            <Row label="Heading" value={formatHeading(pos.heading)} mono />
            <Row label="Speed"       value={formatSpeed(pos.speed_over_ground)} mono />
            <Row label="Draught"     value={pos.draught     != null ? `${pos.draught} m` : "—"} mono />
            <Row label="Destination" value={pos.destination ?? "—"} />
          </div>
        </div>

        {/* Last update */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ocean-400 mb-2">
            <Clock size={10} /> Last Update
          </div>
          <div className="bg-ocean-800/40 rounded-lg p-3">
            <div className="text-xs text-white/90">{formatAge(pos.timestamp)}</div>
            <div className="text-[10px] text-ocean-400 font-mono mt-1">
              {new Date(pos.timestamp).toUTCString()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

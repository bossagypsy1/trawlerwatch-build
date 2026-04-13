"use client";

import { FilterState, NavStatus, DEFAULT_FILTERS } from "@/types";
import { UNIQUE_FLAGS } from "@/lib/data/mockData";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";

interface Props {
  filters:       FilterState;
  onChange:      (filters: FilterState) => void;
  totalCount:    number;
  filteredCount: number;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] uppercase tracking-widest text-ocean-400 block mb-1">
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value:    string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-ocean-800/60 border border-ocean-700/50 rounded-md
        text-xs text-white/90 px-2.5 py-1.5
        focus:outline-none focus:border-ocean-500/70 cursor-pointer"
    >
      {children}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked:  boolean;
  onChange: (v: boolean) => void;
  label:    string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
          checked ? "bg-signal-blue" : "bg-ocean-700"
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow
            transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className="text-xs text-ocean-300 group-hover:text-white/90 transition-colors">
        {label}
      </span>
    </label>
  );
}

const NAV_STATUS_OPTIONS: { value: NavStatus | ""; label: string }[] = [
  { value: "",                           label: "All statuses"               },
  { value: "fishing",                    label: "Fishing"                    },
  { value: "underway_engine",            label: "Underway (Engine)"          },
  { value: "at_anchor",                  label: "At Anchor"                  },
  { value: "moored",                     label: "Moored"                     },
  { value: "not_under_command",          label: "Not Under Command"          },
  { value: "restricted_manoeuvrability", label: "Restricted Manoeuvrability" },
];

const LAST_UPDATE_OPTIONS = [
  { value:   1, label: "Last 1 hour"   },
  { value:   6, label: "Last 6 hours"  },
  { value:  12, label: "Last 12 hours" },
  { value:  24, label: "Last 24 hours" },
  { value:  48, label: "Last 48 hours" },
  { value: 168, label: "Last 7 days"   },
];

export default function FilterPanel({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: Props) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.search          !== DEFAULT_FILTERS.search          ||
    filters.flag            !== DEFAULT_FILTERS.flag            ||
    filters.speedMin        !== DEFAULT_FILTERS.speedMin        ||
    filters.speedMax        !== DEFAULT_FILTERS.speedMax        ||
    filters.navStatus       !== DEFAULT_FILTERS.navStatus       ||
    filters.lastUpdateHours !== DEFAULT_FILTERS.lastUpdateHours ||
    filters.activeOnly      !== DEFAULT_FILTERS.activeOnly;

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="p-4 border-b border-ocean-700/50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-ocean-400" />
            <span className="text-xs font-semibold text-white/90 uppercase tracking-widest">
              Filters
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="flex items-center gap-1 text-[10px] text-ocean-400 hover:text-signal-blue transition-colors"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
        </div>
        <div className="text-[10px] font-mono text-ocean-400">
          <span className="text-white/90 font-semibold">{filteredCount}</span>
          <span> / {totalCount} vessels</span>
          {filteredCount !== totalCount && (
            <span className="text-signal-amber ml-1">(filtered)</span>
          )}
        </div>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Search */}
        <div>
          <Label>Search</Label>
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ocean-400 pointer-events-none"
            />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
              placeholder="Name, MMSI, callsign…"
              className="w-full bg-ocean-800/60 border border-ocean-700/50 rounded-md
                text-xs text-white/90 pl-7 pr-2.5 py-1.5
                placeholder-ocean-500 focus:outline-none focus:border-ocean-500/70"
            />
          </div>
        </div>

        {/* Flag */}
        <div>
          <Label>Flag State</Label>
          <Select value={filters.flag} onChange={(v) => set("flag", v)}>
            <option value="">All flags</option>
            {UNIQUE_FLAGS.map((flag) => (
              <option key={flag} value={flag}>{flag}</option>
            ))}
          </Select>
        </div>

        {/* Nav status */}
        <div>
          <Label>Navigation Status</Label>
          <Select
            value={filters.navStatus}
            onChange={(v) => set("navStatus", v as NavStatus | "")}
          >
            {NAV_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        {/* Speed range */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Speed (knots)</Label>
            <span className="text-[10px] font-mono text-ocean-300">
              {filters.speedMin} – {filters.speedMax} kn
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[9px] text-ocean-500 mb-1">
                <span>Min</span><span>{filters.speedMin} kn</span>
              </div>
              <input
                type="range" min={0} max={15} step={0.5}
                value={filters.speedMin}
                onChange={(e) =>
                  set("speedMin", Math.min(Number(e.target.value), filters.speedMax))
                }
                className="w-full accent-signal-blue cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-ocean-500 mb-1">
                <span>Max</span><span>{filters.speedMax} kn</span>
              </div>
              <input
                type="range" min={0} max={20} step={0.5}
                value={filters.speedMax}
                onChange={(e) =>
                  set("speedMax", Math.max(Number(e.target.value), filters.speedMin))
                }
                className="w-full accent-signal-blue cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Last update */}
        <div>
          <Label>Last Update</Label>
          <Select
            value={String(filters.lastUpdateHours)}
            onChange={(v) => set("lastUpdateHours", Number(v))}
          >
            {LAST_UPDATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-1">
          <Toggle
            checked={filters.showTrails}
            onChange={(v) => set("showTrails", v)}
            label="Show vessel trails"
          />
          <Toggle
            checked={filters.activeOnly}
            onChange={(v) => set("activeOnly", v)}
            label="Active trawlers only (> 0.5 kn)"
          />
        </div>
      </div>
    </div>
  );
}

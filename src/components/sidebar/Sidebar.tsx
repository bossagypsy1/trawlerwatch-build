"use client";

import { useState, useEffect } from "react";
import { VesselWithPosition, FilterState } from "@/types";
import FilterPanel    from "./FilterPanel";
import VesselListItem from "./VesselListItem";
import VesselDetail   from "./VesselDetail";
import { Waves, ListFilter, List, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  vessels:         VesselWithPosition[];
  filteredVessels: VesselWithPosition[];
  filters:         FilterState;
  onFiltersChange: (f: FilterState) => void;
  selectedVessel:  VesselWithPosition | null;
  onVesselSelect:  (vessel: VesselWithPosition | null) => void;
  loading:         boolean;
}

type Tab = "vessels" | "filters";

export default function Sidebar({
  vessels,
  filteredVessels,
  filters,
  onFiltersChange,
  selectedVessel,
  onVesselSelect,
  loading,
}: Props) {
  const [tab,       setTab]       = useState<Tab>("vessels");
  const [collapsed, setCollapsed] = useState(false);
  const [utcTime,   setUtcTime]   = useState<string>("");

  useEffect(() => {
    const update = () => setUtcTime(new Date().toUTCString().slice(17, 25));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="absolute top-0 right-0 h-full z-10 transition-transform duration-300 ease-in-out"
      style={{ width: 320, transform: collapsed ? "translateX(320px)" : "translateX(0)" }}
    >
      {/* Collapse tab — attached to the left edge of the sidebar */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -left-7 top-1/2 -translate-y-1/2
          w-7 h-14 flex items-center justify-center
          bg-ocean-800/95 border border-r-0 border-ocean-700/60 rounded-l-lg
          text-ocean-400 hover:text-white hover:bg-ocean-700/95
          transition-colors shadow-xl backdrop-blur-sm"
      >
        {collapsed ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      {/* Main panel */}
      <div className="flex flex-col w-full h-full bg-ocean-900/97 backdrop-blur-sm border-l border-ocean-700/40 shadow-2xl">

        {/* Brand strip */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-ocean-700/50 bg-ocean-950/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <Waves size={18} className="text-signal-blue" />
            <span className="font-display font-bold text-white text-sm tracking-tight">
              TrawlerWatch
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
            <span className="text-[10px] text-ocean-400 font-mono uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-ocean-700/50 bg-ocean-900/60 shrink-0">
          {(["vessels", "filters"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5
                text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                tab === t
                  ? "text-signal-blue border-b-2 border-signal-blue"
                  : "text-ocean-400 hover:text-white/80"
              }`}
            >
              {t === "vessels" ? <List size={12} /> : <ListFilter size={12} />}
              {t === "vessels" ? "Vessels" : "Filters"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">

          {/* Vessel detail panel */}
          {selectedVessel && tab === "vessels" ? (
            <VesselDetail
              vessel={selectedVessel}
              onClose={() => onVesselSelect(null)}
            />

          ) : tab === "vessels" ? (
            /* Vessel list */
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                  /* Skeleton rows */
                  <div className="flex flex-col gap-1.5 p-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[52px] bg-ocean-800/50 rounded-lg animate-pulse"
                        style={{ animationDelay: `${i * 60}ms` }}
                      />
                    ))}
                  </div>
                ) : filteredVessels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-ocean-500">
                    <Waves size={24} className="mb-2 opacity-40" />
                    <p className="text-xs">No vessels match current filters</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredVessels.map((vessel) => (
                      <VesselListItem
                        key={vessel.id}
                        vessel={vessel}
                        isSelected={selectedVessel?.id === vessel.id}
                        onClick={() => {
                          onVesselSelect(vessel);
                          setTab("vessels");
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

          ) : (
            /* Filter panel */
            <FilterPanel
              filters={filters}
              onChange={onFiltersChange}
              totalCount={vessels.length}
              filteredCount={filteredVessels.length}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-ocean-700/50 bg-ocean-950/40 flex items-center justify-between shrink-0">
          <span className="text-[9px] text-ocean-600 font-mono uppercase tracking-wider">
            Sample AIS · UK waters
          </span>
          <span className="text-[9px] text-ocean-600 font-mono">
            {utcTime} UTC
          </span>
        </div>
      </div>
    </div>
  );
}

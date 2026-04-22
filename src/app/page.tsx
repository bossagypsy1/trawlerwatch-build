"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { VesselWithPosition, FilterState, DEFAULT_FILTERS } from "@/types";
import { filterVessels } from "@/lib/data/vesselService";
import { useAISStream } from "@/lib/hooks/useAISStream";
import Sidebar      from "@/components/sidebar/Sidebar";
import StatsBar     from "@/components/ui/StatsBar";
import MapLegend    from "@/components/ui/MapLegend";
import MapControls  from "@/components/ui/MapControls";

// Leaflet must be loaded client-side only
const TrawlerMap = dynamic(() => import("@/components/map/TrawlerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-ocean-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-signal-blue/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-signal-blue/60 animate-ping [animation-delay:0.3s]" />
          <div className="absolute inset-4 rounded-full bg-signal-blue/80 animate-pulse" />
        </div>
        <div className="text-ocean-400 text-xs font-mono uppercase tracking-widest animate-pulse">
          Initialising chart…
        </div>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const { vessels: allVessels, connected, loading } = useAISStream();

  const [selectedVessel, setSelectedVessel] = useState<VesselWithPosition | null>(null);
  const [filters,        setFilters]        = useState<FilterState>(DEFAULT_FILTERS);
  const [mapTheme,       setMapTheme]       = useState<"light" | "dark">("light");
  const [showEEZ,        setShowEEZ]        = useState(false);

  const filteredVessels = useMemo(
    () => filterVessels(allVessels, filters),
    [allVessels, filters],
  );

  const handleVesselSelect = useCallback(
    (vessel: VesselWithPosition | null) => setSelectedVessel(vessel),
    [],
  );

  return (
    <main className="relative w-full h-full overflow-hidden bg-ocean-950">

      {/* Full-screen map */}
      <div className="absolute inset-0 isolate">
        <TrawlerMap
          vessels={filteredVessels}
          selectedVessel={selectedVessel}
          onVesselSelect={handleVesselSelect}
          filters={filters}
          mapTheme={mapTheme}
          showEEZ={showEEZ}
        />
      </div>

      {/* Top-left stats bar */}
      {!loading && allVessels.length > 0 && (
        <StatsBar vessels={filteredVessels} />
      )}

      {/* Bottom-left controls row: legend + map toggles */}
      <div className="absolute bottom-8 left-14 z-10 flex items-center gap-2">
        <MapLegend />
        <MapControls
          mapTheme={mapTheme}
          onToggleTheme={() => setMapTheme((t) => t === "light" ? "dark" : "light")}
          showEEZ={showEEZ}
          onToggleEEZ={() => setShowEEZ((v) => !v)}
        />
      </div>

      {/* Initial loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ocean-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0   rounded-full border-2 border-signal-blue/20 animate-ping" />
              <div className="absolute inset-2   rounded-full border-2 border-signal-blue/40 animate-ping [animation-delay:0.25s]" />
              <div className="absolute inset-4   rounded-full border-2 border-signal-blue/70 animate-ping [animation-delay:0.5s]" />
              <div className="absolute inset-[22px] rounded-full bg-signal-blue animate-pulse" />
            </div>
            <div className="text-center">
              <div className="text-white font-display font-semibold mb-1">TrawlerWatch</div>
              <div className="text-ocean-400 text-xs font-mono uppercase tracking-widest animate-pulse">
                Connecting to AIS stream…
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right sidebar */}
      <Sidebar
        vessels={allVessels}
        filteredVessels={filteredVessels}
        filters={filters}
        onFiltersChange={setFilters}
        selectedVessel={selectedVessel}
        onVesselSelect={handleVesselSelect}
        connected={connected}
        loading={loading}
      />
    </main>
  );
}

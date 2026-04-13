"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { VesselWithPosition, FilterState, DEFAULT_FILTERS } from "@/types";
import { getAllVessels, filterVessels } from "@/lib/data/vesselService";
import Sidebar   from "@/components/sidebar/Sidebar";
import StatsBar  from "@/components/ui/StatsBar";
import MapLegend from "@/components/ui/MapLegend";

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
  const [allVessels,     setAllVessels]     = useState<VesselWithPosition[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<VesselWithPosition | null>(null);
  const [filters,        setFilters]        = useState<FilterState>(DEFAULT_FILTERS);

  // ── Load vessel data (and refresh every 60 s) ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllVessels();
        if (!cancelled) setAllVessels(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load vessel data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Keep selected vessel data fresh when the list reloads ─────────────────
  useEffect(() => {
    if (!selectedVessel) return;
    const refreshed = allVessels.find((v) => v.id === selectedVessel.id);
    if (refreshed) setSelectedVessel(refreshed);
  }, [allVessels]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredVessels = useMemo(
    () => filterVessels(allVessels, filters),
    [allVessels, filters],
  );

  const handleVesselSelect = useCallback(
    (vessel: VesselWithPosition | null) => setSelectedVessel(vessel),
    [],
  );

  // ── Error screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-ocean-950">
        <div className="text-center p-8 max-w-sm">
          <div className="text-signal-red text-4xl mb-4">⚠</div>
          <h2 className="text-white font-display font-bold mb-2">Data Error</h2>
          <p className="text-ocean-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-ocean-700 hover:bg-ocean-600 text-white text-sm rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="relative w-full h-full overflow-hidden bg-ocean-950">

      {/* Full-screen map */}
      <div className="absolute inset-0 isolate">
        <TrawlerMap
          vessels={filteredVessels}
          selectedVessel={selectedVessel}
          onVesselSelect={handleVesselSelect}
          filters={filters}
        />
      </div>

      {/* Top-left stats bar */}
      {!loading && allVessels.length > 0 && (
        <StatsBar vessels={filteredVessels} />
      )}

      {/* Bottom-left legend */}
      <MapLegend />

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
                Loading vessel data…
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
        loading={loading}
      />
    </main>
  );
}

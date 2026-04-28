"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { VesselWithPosition, FilterState, DEFAULT_FILTERS } from "@/types";
import { filterVessels } from "@/lib/data/vesselService";
import { useAISStream } from "@/lib/hooks/useAISStream";
import Sidebar        from "@/components/sidebar/Sidebar";
import StatsBar       from "@/components/ui/StatsBar";
import MapLegend      from "@/components/ui/MapLegend";
import MapControls    from "@/components/ui/MapControls";
import LocaleSelector from "@/components/ui/LocaleSelector";
import AuthControls   from "@/components/auth/AuthControls";
import { DEFAULT_LOCALE, Locale } from "@/lib/locales";

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
          Initialising chart...
        </div>
      </div>
    </div>
  ),
});

export default function DashboardClient() {
  const { vessels: allVessels, connected, loading } = useAISStream();

  const [selectedVessel, setSelectedVessel] = useState<VesselWithPosition | null>(null);
  const [filters,        setFilters]        = useState<FilterState>(DEFAULT_FILTERS);
  const [mapTheme,       setMapTheme]       = useState<"light" | "dark">("light");
  const [showEEZ,        setShowEEZ]        = useState(false);
  const [locale,         setLocale]         = useState<Locale>(DEFAULT_LOCALE);

  const handleLocaleChange = useCallback(async (next: Locale) => {
    setLocale(next);
    try {
      await fetch("/api/ais-locale", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ localeId: next.id }),
      });
    } catch {
      // backend unreachable - map still pans, vessels clear on next poll
    }
  }, []);

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
      <div className="absolute inset-0 isolate">
        <TrawlerMap
          vessels={filteredVessels}
          selectedVessel={selectedVessel}
          onVesselSelect={handleVesselSelect}
          filters={filters}
          mapTheme={mapTheme}
          showEEZ={showEEZ}
          locale={locale}
        />
      </div>

      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <LocaleSelector locale={locale} onChange={handleLocaleChange} />
        <AuthControls />
        {!loading && allVessels.length > 0 && (
          <StatsBar vessels={filteredVessels} />
        )}
      </div>

      <div className="absolute bottom-8 left-14 z-10 flex items-center gap-2">
        <MapLegend />
        <MapControls
          mapTheme={mapTheme}
          onToggleTheme={() => setMapTheme((t) => t === "light" ? "dark" : "light")}
          showEEZ={showEEZ}
          onToggleEEZ={() => setShowEEZ((v) => !v)}
        />
      </div>

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
                Connecting to AIS stream...
              </div>
            </div>
          </div>
        </div>
      )}

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

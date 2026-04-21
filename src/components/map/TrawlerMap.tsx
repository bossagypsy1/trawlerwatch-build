"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, DivIcon, Marker, Polyline } from "leaflet";
import { VesselWithPosition, FilterState } from "@/types";
import { NAV_STATUS_COLOR } from "@/lib/utils";
import { vesselTypeColor } from "@/lib/vesselTypes";

interface MapProps {
  vessels:        VesselWithPosition[];
  selectedVessel: VesselWithPosition | null;
  onVesselSelect: (vessel: VesselWithPosition) => void;
  filters:        FilterState;
}

type LeafletLib = typeof import("leaflet");

function buildVesselIcon(
  leaflet:    LeafletLib,
  vessel:     VesselWithPosition,
  isSelected: boolean,
): DivIcon {
  const pos      = vessel.latest_position;
  const color    = vesselTypeColor(vessel.vessel_type);
  const heading  = pos.heading === 511 ? pos.course_over_ground : pos.heading;
  const size     = isSelected ? 20 : 14;
  const hw       = size + 8; // icon canvas width/height
  const isMoving = pos.speed_over_ground > 0.5;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${hw}" height="${hw}" viewBox="0 0 ${hw} ${hw}">`,
    `<g transform="translate(${hw / 2},${hw / 2}) rotate(${heading})">`,
    `<path d="M 0,${-(size / 2)} L ${size / 3},${size / 2} L 0,${size / 3} L ${-(size / 3)},${size / 2} Z"`,
    ` fill="${color}"`,
    ` stroke="${isSelected ? "#ffffff" : "rgba(0,0,0,0.5)"}"`,
    ` stroke-width="${isSelected ? 2 : 1}"`,
    ` opacity="${isMoving ? 1 : 0.65}"/>`,
    isSelected
      ? `<circle r="${size / 2 + 4}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5"/>`
      : "",
    `</g></svg>`,
  ].join("");

  return leaflet.divIcon({
    html:       svg,
    className:  "",
    iconSize:   [hw, hw],
    iconAnchor: [hw / 2, hw / 2],
  });
}

export default function TrawlerMap({
  vessels,
  selectedVessel,
  onVesselSelect,
  filters,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const leafletRef   = useRef<LeafletLib | null>(null);
  const markersRef   = useRef<Map<string, Marker>>(new Map());
  const trailsRef    = useRef<Map<string, Polyline>>(new Map());

  // leafletReady flips to true once the async import + map init completes,
  // which causes the marker and trail effects to run with a valid L reference.
  const [leafletReady, setLeafletReady] = useState(false);

  // ── Initialise Leaflet map once ───────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import("leaflet").then((leaflet) => {
      if (mapRef.current) return; // StrictMode double-fire guard

      // Silence missing-icon warning from Next.js static file handling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = leaflet.map(containerRef.current!, {
        center:             [56.5, -3.5], // centred on UK
        zoom:               6,
        zoomControl:        false,
        attributionControl: true,
      });

      // Light basemap (no labels)
      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a> ' +
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          subdomains: "abcd",
          maxZoom:    19,
        })
        .addTo(map);

      // Place-name label overlay
      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
          attribution: "",
          subdomains:  "abcd",
          maxZoom:     19,
          pane:        "overlayPane",
        })
        .addTo(map);

      leaflet.control.zoom({ position: "bottomleft" }).addTo(map);

      leafletRef.current = leaflet;
      mapRef.current     = map;
      setLeafletReady(true); // triggers marker + trail effects
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current     = null;
      leafletRef.current = null;
      setLeafletReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draw / update vessel markers ──────────────────────────────────────────
  useEffect(() => {
    const map     = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !leafletReady) return;

    // Remove markers for vessels no longer in the filtered list
    const visibleIds = new Set(vessels.map((v) => v.id));
    markersRef.current.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Upsert every visible vessel
    vessels.forEach((vessel) => {
      const pos        = vessel.latest_position;
      const isSelected = selectedVessel?.id === vessel.id;
      const icon       = buildVesselIcon(leaflet, vessel, isSelected);

      if (markersRef.current.has(vessel.id)) {
        const m = markersRef.current.get(vessel.id)!;
        m.setLatLng([pos.latitude, pos.longitude]);
        m.setIcon(icon);
        m.setZIndexOffset(isSelected ? 1000 : 0);
      } else {
        const m = leaflet
          .marker([pos.latitude, pos.longitude], { icon })
          .addTo(map)
          .on("click", () => onVesselSelect(vessel));
        markersRef.current.set(vessel.id, m);
      }
    });
  }, [leafletReady, vessels, selectedVessel, onVesselSelect]);

  // ── Draw / update vessel trail ────────────────────────────────────────────
  useEffect(() => {
    const map     = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !leafletReady) return;

    // Clear previous trail segments
    trailsRef.current.forEach((line) => line.remove());
    trailsRef.current.clear();

    if (!filters.showTrails || !selectedVessel?.trail?.length) return;

    const color = vesselTypeColor(selectedVessel.vessel_type);
    const pos   = selectedVessel.latest_position;

    // Build coords oldest → newest; trail array is stored newest-first
    const coords: [number, number][] = [
      ...[...selectedVessel.trail]
        .reverse()
        .map((p): [number, number] => [p.latitude, p.longitude]),
      [pos.latitude, pos.longitude],
    ];

    // Render segments with increasing opacity toward current position
    coords.forEach((coord, i) => {
      if (i === 0) return;
      const frac = i / (coords.length - 1);
      const line = leaflet
        .polyline([coords[i - 1], coord], {
          color,
          weight:    2,
          opacity:   0.15 + frac * 0.65,
          dashArray: frac < 0.8 ? "4 5" : undefined,
        })
        .addTo(map);
      trailsRef.current.set(`seg-${i}`, line);
    });
  }, [leafletReady, selectedVessel, filters.showTrails]);

  // ── Fly to selected vessel ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedVessel) return;
    const { latitude, longitude } = selectedVessel.latest_position;
    mapRef.current.flyTo(
      [latitude, longitude],
      Math.max(mapRef.current.getZoom(), 8),
      { duration: 0.8 },
    );
  }, [selectedVessel]);

  return <div ref={containerRef} className="w-full h-full" />;
}

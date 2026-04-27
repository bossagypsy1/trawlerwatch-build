"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, DivIcon, Marker, Polyline, TileLayer } from "leaflet";
import { VesselWithPosition, FilterState } from "@/types";
import { vesselTypeColor } from "@/lib/vesselTypes";
import { Locale } from "@/lib/locales";

interface MapProps {
  vessels:        VesselWithPosition[];
  selectedVessel: VesselWithPosition | null;
  onVesselSelect: (vessel: VesselWithPosition) => void;
  filters:        FilterState;
  mapTheme:       "light" | "dark";
  showEEZ:        boolean;
  locale:         Locale;
}

type LeafletLib = typeof import("leaflet");

// ── Vessel icon ───────────────────────────────────────────────────────────────

function buildVesselIcon(
  leaflet:    LeafletLib,
  vessel:     VesselWithPosition,
  isSelected: boolean,
): DivIcon {
  const pos      = vessel.latest_position;
  const color    = vesselTypeColor(vessel.vessel_type);
  const heading  = pos.heading === 511 ? pos.course_over_ground : pos.heading;
  const size     = isSelected ? 20 : 14;
  const hw       = size + 8;
  const isMoving = pos.speed_over_ground > 0.5;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${hw}" height="${hw}" viewBox="0 0 ${hw} ${hw}">`,
    `<g transform="translate(${hw / 2},${hw / 2}) rotate(${heading})">`,
    `<path d="M 0,${-(size / 2)} L ${size / 3},${size / 2} L 0,${size / 3} L ${-(size / 3)},${size / 2} Z"`,
    ` fill="${color}"`,
    ` stroke="${isSelected ? "#ffffff" : "rgba(0,0,0,0.4)"}"`,
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrawlerMap({
  vessels,
  selectedVessel,
  onVesselSelect,
  filters,
  mapTheme,
  showEEZ,
  locale,
}: MapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<LeafletMap | null>(null);
  const leafletRef    = useRef<LeafletLib | null>(null);
  const markersRef    = useRef<Map<string, Marker>>(new Map());
  const trailsRef     = useRef<Map<string, Polyline>>(new Map());
  const baseTileRef   = useRef<TileLayer | null>(null);
  const labelTileRef  = useRef<TileLayer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eezLayerRef   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bboxRectsRef  = useRef<any[]>([]);

  const [leafletReady, setLeafletReady] = useState(false);

  // ── 1. Initialise Leaflet map (no tile layers here) ───────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import("leaflet").then((leaflet) => {
      if (mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = leaflet.map(containerRef.current!, {
        center:             [56.5, -3.5],
        zoom:               6,
        zoomControl:        false,
        attributionControl: true,
      });

      leaflet.control.zoom({ position: "bottomleft" }).addTo(map);

      leafletRef.current = leaflet;
      mapRef.current     = map;
      setLeafletReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current     = null;
      leafletRef.current = null;
      setLeafletReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Fly to locale center/zoom when locale changes ─────────────────────
  useEffect(() => {
    if (!mapRef.current || !leafletReady) return;
    mapRef.current.flyTo(locale.center, locale.zoom, { duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, locale.id]);

  // ── 3. Swap base tile layers when theme changes ───────────────────────────
  useEffect(() => {
    const map     = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !leafletReady) return;

    // Remove current tiles
    baseTileRef.current?.remove();
    labelTileRef.current?.remove();

    const t = mapTheme; // "light" | "dark"

    baseTileRef.current = leaflet
      .tileLayer(`https://{s}.basemaps.cartocdn.com/${t}_nolabels/{z}/{x}/{y}{r}.png`, {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> ' +
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: "abcd",
        maxZoom:    19,
      })
      .addTo(map);

    labelTileRef.current = leaflet
      .tileLayer(`https://{s}.basemaps.cartocdn.com/${t}_only_labels/{z}/{x}/{y}{r}.png`, {
        attribution: "",
        subdomains:  "abcd",
        maxZoom:     19,
        pane:        "overlayPane",
      })
      .addTo(map);
  }, [leafletReady, mapTheme]);

  // ── 4. Toggle EEZ / international waters WMS overlay ─────────────────────
  useEffect(() => {
    const map     = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !leafletReady) return;

    if (eezLayerRef.current) {
      eezLayerRef.current.remove();
      eezLayerRef.current = null;
    }

    if (showEEZ) {
      // Marine Regions (VLIZ) public WMS — World EEZ v11 boundary layer
      // https://www.vliz.be/en/imis?module=dataset&dasid=1600
      eezLayerRef.current = (leaflet.tileLayer as any).wms(
        "https://geo.vliz.be/geoserver/MarineRegions/wms",
        {
          layers:      "eez_boundaries",
          format:      "image/png",
          transparent: true,
          opacity:     0.7,
          version:     "1.1.1",
          // Blue dashed boundary lines on a transparent background
        },
      ).addTo(map);
    }
  }, [leafletReady, showEEZ]);

  // ── 5. Draw bounding box rectangle(s) for current locale ─────────────────
  useEffect(() => {
    const map     = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !leafletReady) return;

    // Remove old rectangles
    bboxRectsRef.current.forEach((r) => r.remove());
    bboxRectsRef.current = [];

    // Draw one rectangle per bounding box
    locale.boundingBoxes.forEach(([[swLat, swLon], [neLat, neLon]]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rect = (leaflet as any).rectangle(
        [[swLat, swLon], [neLat, neLon]],
        {
          color:       "#58a6ff",
          weight:      1.5,
          opacity:     0.55,
          fill:        true,
          fillColor:   "#58a6ff",
          fillOpacity: 0.04,
          dashArray:   "6 5",
          interactive: false,
        },
      ).addTo(map);
      bboxRectsRef.current.push(rect);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, locale.id]);

  // ── 6. Draw / update vessel markers ─────────────────────────────────────
  useEffect(() => {
    const map     = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !leafletReady) return;

    const visibleIds = new Set(vessels.map((v) => v.id));
    markersRef.current.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

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

  // ── 6. Draw / update vessel trail ────────────────────────────────────────
  useEffect(() => {
    const map     = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !leafletReady) return;

    trailsRef.current.forEach((line) => line.remove());
    trailsRef.current.clear();

    if (!filters.showTrails || !selectedVessel?.trail?.length) return;

    const color = vesselTypeColor(selectedVessel.vessel_type);
    const pos   = selectedVessel.latest_position;

    const coords: [number, number][] = [
      ...[...selectedVessel.trail]
        .reverse()
        .map((p): [number, number] => [p.latitude, p.longitude]),
      [pos.latitude, pos.longitude],
    ];

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

  // ── 7. Fly to selected vessel ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedVessel) return;
    const { latitude, longitude } = selectedVessel.latest_position;
    mapRef.current.flyTo(
      [latitude, longitude],
      Math.max(mapRef.current.getZoom(), 8),
      { duration: 0.8 },
    );
  }, [selectedVessel]);

  // Container background matches the theme immediately (before tiles load)
  const bg = mapTheme === "dark" ? "#020b18" : "#f0eeeb";

  return <div ref={containerRef} className="w-full h-full" style={{ background: bg }} />;
}

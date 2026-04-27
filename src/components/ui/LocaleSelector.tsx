"use client";

import { MapPin } from "lucide-react";
import { LOCALES, Locale } from "@/lib/locales";

interface Props {
  locale:   Locale;
  onChange: (locale: Locale) => void;
}

function fmtCoord(lat: number, lon: number): string {
  return `${Math.abs(lat)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon)}°${lon >= 0 ? "E" : "W"}`;
}

function fmtBBox([[swLat, swLon], [neLat, neLon]]: [[number, number], [number, number]]): string {
  return `${fmtCoord(swLat, swLon)} → ${fmtCoord(neLat, neLon)}`;
}

export default function LocaleSelector({ locale, onChange }: Props) {
  const bbox = locale.boundingBoxes[0];

  return (
    <div
      className="flex flex-col gap-1
        bg-ocean-900/90 backdrop-blur-sm border border-ocean-700/50
        rounded-lg px-3 py-2 shadow-xl"
    >
      <div className="flex items-center gap-2">
        <MapPin size={11} className="text-ocean-400 shrink-0" />
        <select
          value={locale.id}
          onChange={(e) => {
            const next = LOCALES.find((l) => l.id === e.target.value);
            if (next) onChange(next);
          }}
          className="bg-transparent text-[11px] text-white/90 font-mono
            focus:outline-none cursor-pointer appearance-none pr-4"
          style={{ backgroundImage: "none" }}
        >
          {LOCALES.map((l) => (
            <option key={l.id} value={l.id} className="bg-ocean-900 text-white">
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {bbox && (
        <div className="text-[10px] text-ocean-400/80 font-mono pl-0.5 leading-none">
          {fmtBBox(bbox)}
        </div>
      )}
    </div>
  );
}

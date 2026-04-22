"use client";

import { MapPin } from "lucide-react";
import { LOCALES, Locale } from "@/lib/locales";

interface Props {
  locale:   Locale;
  onChange: (locale: Locale) => void;
}

export default function LocaleSelector({ locale, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-2
        bg-ocean-900/90 backdrop-blur-sm border border-ocean-700/50
        rounded-lg px-3 py-1.5 shadow-xl"
    >
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
  );
}

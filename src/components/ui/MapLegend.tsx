"use client";

import { useState } from "react";
import { NavStatus } from "@/types";
import { NAV_STATUS_COLOR, NAV_STATUS_LABEL } from "@/lib/utils";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

const LEGEND_ITEMS: NavStatus[] = [
  "fishing",
  "underway_engine",
  "at_anchor",
  "moored",
  "not_under_command",
];

export default function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-12 left-3 z-10">

      {/* Popup — bottom-full positions it above the button */}
      {open && (
        <div
          className="absolute bottom-full mb-2 left-0
            bg-ocean-900/95 backdrop-blur-sm border border-ocean-700/50
            rounded-lg p-3 shadow-2xl min-w-[164px]"
        >
          <div className="text-[9px] uppercase tracking-widest text-ocean-500 mb-2">
            Nav Status
          </div>
          <div className="space-y-1.5">
            {LEGEND_ITEMS.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: NAV_STATUS_COLOR[status] }}
                />
                <span className="text-[10px] text-ocean-300">
                  {NAV_STATUS_LABEL[status]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-ocean-700/40 text-[9px] text-ocean-600">
            Arrow direction = vessel heading
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-ocean-900/90 backdrop-blur-sm
          border border-ocean-700/50 rounded-lg px-3 py-1.5
          text-[10px] text-ocean-400 hover:text-white transition-colors shadow-xl"
      >
        <Info size={11} />
        Legend
        {open ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
      </button>

    </div>
  );
}

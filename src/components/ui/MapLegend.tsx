"use client";

import { useState } from "react";
import {
  LEGEND_GROUPS,
  VESSEL_TYPE_GROUP_COLOR,
  VESSEL_TYPE_GROUP_LABEL,
} from "@/lib/vesselTypes";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

export default function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-8 left-14 z-10">

      {open && (
        <div
          className="absolute bottom-full mb-2 left-0
            bg-ocean-900/95 backdrop-blur-sm border border-ocean-700/50
            rounded-lg p-3 shadow-2xl min-w-[180px]"
        >
          <div className="text-[9px] uppercase tracking-widest text-ocean-500 mb-2">
            Vessel Type
          </div>
          <div className="space-y-1.5">
            {LEGEND_GROUPS.map((group) => (
              <div key={group} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: VESSEL_TYPE_GROUP_COLOR[group] }}
                />
                <span className="text-[10px] text-ocean-300">
                  {VESSEL_TYPE_GROUP_LABEL[group]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-ocean-700/40 text-[9px] text-ocean-600">
            Arrow direction = vessel heading
          </div>
        </div>
      )}

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

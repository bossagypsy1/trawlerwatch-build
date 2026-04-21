"use client";

import { Sun, Moon, Globe } from "lucide-react";

interface Props {
  mapTheme:       "light" | "dark";
  onToggleTheme:  () => void;
  showEEZ:        boolean;
  onToggleEEZ:    () => void;
}

function ControlBtn({
  active,
  onClick,
  title,
  children,
}: {
  active:   boolean;
  onClick:  () => void;
  title:    string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 backdrop-blur-sm rounded-lg px-3 py-1.5
        text-[10px] transition-colors shadow-xl border
        ${active
          ? "bg-ocean-900/95 text-signal-blue border-signal-blue/50"
          : "bg-ocean-900/90 text-ocean-400 hover:text-white border-ocean-700/50"
        }`}
    >
      {children}
    </button>
  );
}

export default function MapControls({ mapTheme, onToggleTheme, showEEZ, onToggleEEZ }: Props) {
  return (
    <div className="absolute bottom-8 right-4 z-10 flex flex-col gap-2 items-end">
      <ControlBtn
        active={mapTheme === "dark"}
        onClick={onToggleTheme}
        title={mapTheme === "light" ? "Switch to dark map" : "Switch to light map"}
      >
        {mapTheme === "light" ? <Moon size={11} /> : <Sun size={11} />}
        {mapTheme === "light" ? "Dark map" : "Light map"}
      </ControlBtn>

      <ControlBtn
        active={showEEZ}
        onClick={onToggleEEZ}
        title={showEEZ ? "Hide EEZ / international waters boundary" : "Show EEZ / international waters boundary"}
      >
        <Globe size={11} />
        EEZ limits
      </ControlBtn>
    </div>
  );
}

import React from "react";
import { RemoteMode } from "../../core/types";
import {
  Gamepad2,
  Tv,
  Radio,
  MousePointer,
  Compass,
  Keyboard,
  Hash,
  Grid,
  Volume2,
  Accessibility
} from "lucide-react";

interface MobileModeBarProps {
  currentMode: RemoteMode;
  onSelectMode: (mode: RemoteMode) => void;
}

export const MobileModeBar: React.FC<MobileModeBarProps> = ({
  currentMode,
  onSelectMode
}) => {
  const modes: { id: RemoteMode; label: string; icon: any }[] = [
    { id: "classic", label: "Classic", icon: Tv },
    { id: "dpad", label: "D-Pad", icon: Compass },
    { id: "touchpad", label: "Touchpad", icon: MousePointer },
    { id: "media", label: "Media", icon: Volume2 },
    { id: "keyboard", label: "Keyboard", icon: Keyboard },
    { id: "numpad", label: "Numpad", icon: Hash },
    { id: "apps", label: "Apps", icon: Grid },
    { id: "gaming", label: "Gaming", icon: Gamepad2 },
    { id: "accessibility", label: "Access", icon: Accessibility }
  ];

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-1.5 shadow-lg overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 min-w-max">
        {modes.map(mode => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              id={`mobile-mode-tab-${mode.id}`}
              onClick={() => onSelectMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400 font-semibold"
                  : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-zinc-400"}`} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

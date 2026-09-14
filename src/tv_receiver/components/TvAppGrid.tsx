import React from "react";
import {
  Play,
  Tv,
  Film,
  Music,
  Radio,
  Gamepad,
  Cast,
  Layers,
  Sparkles,
  Search,
  Sliders
} from "lucide-react";

export interface TvAppItem {
  id: string;
  name: string;
  category: "streaming" | "music" | "input" | "system";
  iconBg: string;
  textColor: string;
  badge?: string;
}

interface TvAppGridProps {
  activeApp: string;
  focusedAppIndex: number;
  onLaunchApp: (app: TvAppItem) => void;
}

export const TV_APPS: TvAppItem[] = [
  { id: "youtube", name: "YouTube", category: "streaming", iconBg: "bg-red-600", textColor: "text-white", badge: "4K" },
  { id: "netflix", name: "Netflix", category: "streaming", iconBg: "bg-red-700", textColor: "text-white", badge: "HDR" },
  { id: "prime", name: "Prime Video", category: "streaming", iconBg: "bg-sky-600", textColor: "text-white", badge: "UHD" },
  { id: "disney", name: "Disney+", category: "streaming", iconBg: "bg-blue-800", textColor: "text-white", badge: "IMAX" },
  { id: "spotify", name: "Spotify", category: "music", iconBg: "bg-emerald-600", textColor: "text-white", badge: "HiFi" },
  { id: "plex", name: "Plex Media", category: "streaming", iconBg: "bg-amber-600", textColor: "text-white", badge: "Local" },
  { id: "twitch", name: "Twitch", category: "streaming", iconBg: "bg-purple-600", textColor: "text-white", badge: "Live" },
  { id: "hdmi1", name: "HDMI 1 (PS5)", category: "input", iconBg: "bg-zinc-800", textColor: "text-indigo-400", badge: "120Hz" },
  { id: "hdmi2", name: "HDMI 2 (eARC)", category: "input", iconBg: "bg-zinc-800", textColor: "text-emerald-400", badge: "Dolby" }
];

export const TvAppGrid: React.FC<TvAppGridProps> = ({
  activeApp,
  focusedAppIndex,
  onLaunchApp
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Smart TV Apps & Input Sources</span>
        </h3>
        <span className="text-xs text-zinc-500 font-mono">D-Pad / Remote Navigable</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {TV_APPS.map((app, idx) => {
          const isFocused = focusedAppIndex === idx;
          const isActive = activeApp.toLowerCase().includes(app.id) || activeApp.toLowerCase().includes(app.name.toLowerCase());

          return (
            <button
              key={app.id}
              id={`tv-app-tile-${app.id}`}
              onClick={() => onLaunchApp(app)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 cursor-pointer text-center group outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 focus-visible:ring-indigo-400 ${
                isFocused
                  ? "bg-zinc-800 ring-4 ring-offset-4 ring-offset-zinc-950 ring-indigo-400 tv-focused-element shadow-2xl shadow-indigo-600/60"
                  : isActive
                  ? "bg-zinc-850 border-2 border-indigo-500/80 shadow-lg shadow-indigo-900/30 hover:ring-2 hover:ring-indigo-400/50"
                  : "bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 hover:ring-2 hover:ring-indigo-500/40"
              }`}
            >
              {/* Active Playing Badge */}
              {isActive && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-emerald-500 text-zinc-950 font-black text-[9px] rounded-full shadow">
                  ACTIVE
                </span>
              )}

              {/* App Icon Box */}
              <div className={`w-12 h-12 rounded-2xl ${app.iconBg} ${app.textColor} flex items-center justify-center shadow-lg mb-2 font-black text-sm tracking-wider transition-transform group-hover:scale-105`}>
                {app.category === "music" ? (
                  <Music className="w-6 h-6" />
                ) : app.category === "input" ? (
                  <Tv className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 fill-current" />
                )}
              </div>

              {/* App Title */}
              <span className="text-xs font-bold text-zinc-200 truncate w-full">
                {app.name}
              </span>

              {/* Quality Badge */}
              {app.badge && (
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  {app.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

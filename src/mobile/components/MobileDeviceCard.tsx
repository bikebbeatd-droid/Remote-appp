import React from "react";
import { TvDevice, ConnectionState } from "../../core/types";
import { Tv, ChevronDown, Mic, Layers, Wrench, Search, RefreshCw, Smartphone } from "lucide-react";

interface MobileDeviceCardProps {
  device: TvDevice | null;
  connectionState: ConnectionState;
  onOpenTvSelector: () => void;
  onOpenVoiceRemote: () => void;
  onOpenCapabilityMatrix: () => void;
  onOpenPairing?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenButtonMapper?: () => void;
  onOpenCustomBuilder?: () => void;
  onOpenLearnRemote?: () => void;
  onOpenScenes?: () => void;
  onOpenShareProfile?: () => void;
}

export const MobileDeviceCard: React.FC<MobileDeviceCardProps> = ({
  device,
  connectionState,
  onOpenTvSelector,
  onOpenVoiceRemote,
  onOpenCapabilityMatrix,
  onOpenPairing,
  onOpenDiagnostics,
  onOpenButtonMapper,
  onOpenCustomBuilder,
  onOpenLearnRemote,
  onOpenScenes,
  onOpenShareProfile
}) => {
  const [showToolsMenu, setShowToolsMenu] = React.useState(false);

  return (
    <div id="mobile-device-card" className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-3 shadow-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
      
      {/* Device Selection button */}
      <button
        id="mobile-tv-select-btn"
        onClick={onOpenTvSelector}
        className="flex items-center gap-3 text-left hover:bg-zinc-800/80 p-1.5 rounded-2xl transition-colors min-w-0 flex-1 cursor-pointer overflow-hidden"
      >
        <div className="relative p-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl text-indigo-400 shrink-0">
          <Tv className="w-5 h-5" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${
              !device
                ? "bg-zinc-600"
                : connectionState === "CONNECTED"
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : connectionState === "PAIRING" || (device.requiresPairing && !device.isPaired)
                ? "bg-amber-400"
                : connectionState === "CONNECTING"
                ? "bg-sky-400 animate-ping"
                : "bg-zinc-500"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-zinc-100 truncate">
              {device?.name || "No TV Selected"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </div>

          {/* Platform & Actual TV LAN IP */}
          <p className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
            {device ? (
              <>
                <span className="font-bold text-zinc-300">{device.platform.toUpperCase()}</span>
                <span className="mx-1">•</span>
                {device.ip === "127.0.0.1" || device.ip === "localhost" ? (
                  <span className="text-amber-400 font-sans font-medium">Termux Backend</span>
                ) : (
                  <span>{device.ip}</span>
                )}
              </>
            ) : (
              "Tap to search or add TV"
            )}
          </p>

          {/* Real Connection Status Indicator */}
          <div className="flex items-center gap-1.5 text-[10px] mt-0.5 truncate">
            {!device ? (
              <span className="text-zinc-500 font-medium truncate">● No TV connected</span>
            ) : connectionState === "CONNECTED" ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse shrink-0" />
                <span>● Connected</span>
              </span>
            ) : connectionState === "PAIRING" || (device.requiresPairing && !device.isPaired) ? (
              <span className="text-amber-400 font-medium flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span>● Pairing Required</span>
              </span>
            ) : connectionState === "CONNECTING" ? (
              <span className="text-sky-400 font-medium flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                <span>● Connecting...</span>
              </span>
            ) : connectionState === "RECONNECTING" ? (
              <span className="text-amber-400 font-medium flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span>● Reconnecting...</span>
              </span>
            ) : connectionState === "ERROR" ? (
              <span className="text-rose-400 font-medium flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>● Connection Failed</span>
              </span>
            ) : (
              <span className="text-zinc-400 font-medium flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                <span>● Disconnected</span>
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Quick Pair action if TV is discovered but not paired */}
      {device && device.requiresPairing && !device.isPaired && onOpenPairing && (
        <button
          id="mobile-pair-quick-btn"
          onClick={onOpenPairing}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0 cursor-pointer animate-pulse"
        >
          Pair Now
        </button>
      )}

      {/* Actions: Voice & Tools */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="mobile-voice-btn"
          onClick={onOpenVoiceRemote}
          className="p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-xl transition-all cursor-pointer"
          title="Voice Assistant"
        >
          <Mic className="w-4 h-4 text-indigo-400" />
        </button>

        <button
          id="mobile-cap-matrix-btn"
          onClick={onOpenCapabilityMatrix}
          className="p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-xl transition-all cursor-pointer"
          title="TV Capabilities"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
        </button>

        <div className="relative">
          <button
            id="mobile-tools-btn"
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-xl transition-all cursor-pointer"
            title="Advanced Tools"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
          </button>

          {showToolsMenu && (
            <div
              id="mobile-tools-popover"
              className="absolute right-0 top-12 w-52 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100"
            >
              {onOpenButtonMapper && (
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenButtonMapper(); }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Custom Button Mapper
                </button>
              )}
              {onOpenCustomBuilder && (
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenCustomBuilder(); }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Create Custom Remote
                </button>
              )}
              {onOpenLearnRemote && (
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenLearnRemote(); }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Learn IR / Protocol Codes
                </button>
              )}
              {onOpenScenes && (
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenScenes(); }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Automation Scenes & Macros
                </button>
              )}
              {onOpenDiagnostics && (
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenDiagnostics(); }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Live Diagnostics & Latency
                </button>
              )}
              {onOpenShareProfile && (
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenShareProfile(); }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Share Remote Profile (QR)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

import React, { useState } from "react";
import { TvDevice, RemoteMode, RemoteCommandType, ButtonMapping, ConnectionState } from "../core/types";
import { ClassicRemote } from "./ClassicRemote";
import { TouchpadRemote } from "./TouchpadRemote";
import { DpadRemote } from "./DpadRemote";
import { MediaRemote } from "./MediaRemote";
import { KeyboardRemote } from "./KeyboardRemote";
import { NumpadRemote } from "./NumpadRemote";
import { AppLauncherRemote } from "./AppLauncherRemote";
import { GamingRemote } from "./GamingRemote";
import { AccessibilityRemote } from "./AccessibilityRemote";
import {
  Tv,
  ChevronDown,
  Sliders,
  Layers,
  MousePointer,
  Grid,
  PlaySquare,
  Keyboard,
  Hash,
  AppWindow,
  Gamepad2,
  Eye,
  Mic,
  Activity,
  Sparkles,
  Share2,
  AlertTriangle,
  Lock,
  Wrench,
  Radio
} from "lucide-react";

interface MainRemoteProps {
  device: TvDevice | null;
  connectionState?: ConnectionState;
  currentMode: RemoteMode;
  onSelectMode: (mode: RemoteMode) => void;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  isSending: boolean;
  onOpenTvSelector: () => void;
  onOpenCapabilityMatrix: () => void;
  onOpenPairing: () => void;
  onOpenVoiceRemote: () => void;
  onOpenButtonMapper: () => void;
  onOpenCustomBuilder: () => void;
  onOpenLearnRemote: () => void;
  onOpenDiagnostics: () => void;
  onOpenScenes: () => void;
  onOpenShareProfile: () => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const MainRemote: React.FC<MainRemoteProps> = ({
  device,
  connectionState = "DISCONNECTED",
  currentMode,
  onSelectMode,
  onSendCommand,
  isSending,
  onOpenTvSelector,
  onOpenCapabilityMatrix,
  onOpenPairing,
  onOpenVoiceRemote,
  onOpenButtonMapper,
  onOpenCustomBuilder,
  onOpenLearnRemote,
  onOpenDiagnostics,
  onOpenScenes,
  onOpenShareProfile,
  onUnsupportedAttempt
}) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const MODES: Array<{ id: RemoteMode; label: string; icon: any }> = [
    { id: "classic", label: "Classic", icon: Tv },
    { id: "touchpad", label: "Touchpad", icon: MousePointer },
    { id: "dpad", label: "D-Pad", icon: Grid },
    { id: "media", label: "Media", icon: PlaySquare },
    { id: "keyboard", label: "Keyboard", icon: Keyboard },
    { id: "numpad", label: "Numpad", icon: Hash },
    { id: "apps", label: "Apps", icon: AppWindow },
    { id: "gaming", label: "Gaming", icon: Gamepad2 },
    { id: "accessibility", label: "A11y", icon: Eye }
  ];

  return (
    <div id="main-remote-view" className="w-full max-w-screen sm:max-w-md mx-auto flex flex-col space-y-4">
      
      {/* Top TV Bar: Device Selector & Status */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-2.5 sm:p-3.5 shadow-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 max-w-full">
        <button
          id="tv-selector-trigger-btn"
          onClick={onOpenTvSelector}
          className="flex items-center gap-2.5 sm:gap-3 text-left hover:bg-zinc-800/80 p-1 rounded-2xl transition-colors min-w-0 flex-1 cursor-pointer overflow-hidden"
        >
          <div className="relative p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400 shrink-0">
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${
                !device
                  ? "bg-zinc-500"
                  : connectionState === "CONNECTED"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : connectionState === "CONNECTING" || connectionState === "PAIRING" || (device.requiresPairing && !device.isPaired)
                  ? "bg-amber-400 animate-pulse"
                  : connectionState === "RECONNECTING"
                  ? "bg-amber-500 animate-pulse"
                  : connectionState === "ERROR"
                  ? "bg-rose-500"
                  : "bg-zinc-500"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs sm:text-sm text-zinc-100 truncate">
                {device?.name || "No TV Selected"}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
            </div>

            {/* Platform & Actual TV IP (Never 127.0.0.1 as TV endpoint) */}
            <p className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
              {device ? (
                <>
                  <span>{device.platform.toUpperCase()}</span>
                  <span className="mx-1 text-zinc-600">•</span>
                  {device.ip === "127.0.0.1" || device.ip === "localhost" ? (
                    <span className="text-amber-400 font-sans font-medium" title="127.0.0.1 is your phone/Termux backend, not the TV">
                      Termux Backend
                    </span>
                  ) : (
                    <span>{device.ip}</span>
                  )}
                </>
              ) : (
                "Tap to scan Wi-Fi network"
              )}
            </p>

            {/* Real Connection State Badge: e.g. ● Connected */}
            <div className="flex items-center gap-1 text-[10px] mt-0.5 truncate">
              {!device ? (
                <span className="text-zinc-500 font-medium truncate">● No TV connected</span>
              ) : connectionState === "CONNECTED" ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse inline-block shrink-0" />
                  <span className="truncate">● Connected</span>
                </span>
              ) : connectionState === "PAIRING" || (device.requiresPairing && !device.isPaired) ? (
                <span className="text-amber-400 font-medium flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block shrink-0" />
                  <span className="truncate">● Pairing Needed</span>
                </span>
              ) : connectionState === "CONNECTING" ? (
                <span className="text-sky-400 font-medium flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse inline-block shrink-0" />
                  <span className="truncate">● Connecting...</span>
                </span>
              ) : connectionState === "RECONNECTING" ? (
                <span className="text-amber-400 font-medium flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block shrink-0" />
                  <span className="truncate">● Reconnecting...</span>
                </span>
              ) : connectionState === "ERROR" ? (
                <span className="text-rose-400 font-medium flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block shrink-0" />
                  <span className="truncate">● Error</span>
                </span>
              ) : (
                <span className="text-zinc-400 font-medium flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block shrink-0" />
                  <span className="truncate">● Disconnected</span>
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Quick Top Actions: Voice & Capability Matrix */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            id="quick-voice-btn"
            onClick={onOpenVoiceRemote}
            className="p-2 sm:p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-xl transition-all cursor-pointer"
            title="Voice Remote Assistant"
          >
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          </button>

          <button
            id="quick-capability-matrix-btn"
            onClick={onOpenCapabilityMatrix}
            className="p-2 sm:p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-xl transition-all cursor-pointer"
            title="View Device Capabilities Matrix"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </button>

          <div className="relative">
            <button
              id="quick-tools-menu-btn"
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className="p-2 sm:p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 rounded-xl transition-all cursor-pointer"
              title="Advanced Remote Tools"
            >
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </button>

            {/* Popover Tools Menu */}
            {showToolsMenu && (
              <div
                id="tools-dropdown-menu"
                className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenButtonMapper(); }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Button Mapper</span>
                </button>
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenCustomBuilder(); }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Custom Remote Builder</span>
                </button>
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenScenes(); }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Smart Scenes</span>
                </button>
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenLearnRemote(); }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2"
                >
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  <span>Learn IR / Codes</span>
                </button>
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenDiagnostics(); }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Diagnostics & Latency</span>
                </button>
                <button
                  onClick={() => { setShowToolsMenu(false); onOpenShareProfile(); }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 rounded-xl flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share / Backup Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unpaired Alert Banner if pairing is required */}
      {device && device.requiresPairing && !device.isPaired && (
        <div className="w-full p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>This TV requires PIN authorization to accept commands.</span>
          </div>
          <button
            onClick={onOpenPairing}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs transition-colors shrink-0 shadow-sm"
          >
            Pair Now
          </button>
        </div>
      )}

      {/* Mode Switcher Tabs (Horizontally scrollable for mobile) */}
      <div className="w-full overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800/90 p-1.5 rounded-2xl w-max min-w-full">
          {MODES.map(m => {
            const Icon = m.icon;
            const isSelected = currentMode === m.id;
            return (
              <button
                key={m.id}
                id={`mode-tab-${m.id}`}
                onClick={() => onSelectMode(m.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Remote Deck Render Area */}
      <div className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 shadow-2xl relative min-h-[480px] flex flex-col justify-center">
        {isSending && (
          <div className="absolute top-3 right-4 flex items-center gap-1 text-[11px] font-mono text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Sending...</span>
          </div>
        )}

        {currentMode === "classic" && (
          <ClassicRemote
            device={device}
            onSendCommand={onSendCommand}
            isSending={isSending}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
        {currentMode === "touchpad" && (
          <TouchpadRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
        {currentMode === "dpad" && (
          <DpadRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
        {currentMode === "media" && (
          <MediaRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
        {currentMode === "keyboard" && (
          <KeyboardRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
        {currentMode === "numpad" && (
          <NumpadRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
        {currentMode === "apps" && (
          <AppLauncherRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
        {currentMode === "gaming" && (
          <GamingRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
        {currentMode === "accessibility" && (
          <AccessibilityRemote
            device={device}
            onSendCommand={onSendCommand}
            onUnsupportedAttempt={onUnsupportedAttempt}
          />
        )}
      </div>

    </div>
  );
};

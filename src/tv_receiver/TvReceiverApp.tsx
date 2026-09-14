import React, { useState, useEffect, useCallback } from "react";
import { TvDevice } from "../core/types";
import { TvReceiverHeader } from "./components/TvReceiverHeader";
import { TvPairingQrCard } from "./components/TvPairingQrCard";
import { TvAppGrid, TV_APPS, TvAppItem } from "./components/TvAppGrid";
import { TvVolumeHud } from "./components/TvVolumeHud";
import {
  Monitor,
  Power,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  Film,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Sliders,
  CheckCircle,
  Tv,
  ArrowLeft,
  Smartphone
} from "lucide-react";

interface TvReceiverAppProps {
  device: TvDevice | null;
  lastCommand: { command: string; value?: any; timestamp: string } | null;
  pairingPin: string | null;
  onGeneratePin?: () => void;
}

export const TvReceiverApp: React.FC<TvReceiverAppProps> = ({
  device,
  lastCommand,
  pairingPin,
  onGeneratePin
}) => {
  const [powerOn, setPowerOn] = useState(true);
  const [currentApp, setCurrentApp] = useState("Google TV Home");
  const [volume, setVolume] = useState(24);
  const [isMuted, setIsMuted] = useState(false);
  const [channel, setChannel] = useState(7);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);
  const [showManagePhones, setShowManagePhones] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 10-Foot Remote / D-Pad Navigation State
  // Navigation zones: 0 = Pairing actions, 1 = Apps grid
  const [navZone, setNavZone] = useState<"actions" | "apps">("apps");
  const [focusedActionIdx, setFocusedActionIdx] = useState(0);
  const [focusedAppIdx, setFocusedAppIdx] = useState(0);

  // Synchronize state when real commands arrive from mobile remote
  useEffect(() => {
    if (!lastCommand) return;
    const { command, value } = lastCommand;

    if (command === "POWER") {
      setPowerOn(prev => !prev);
      setRecentNotification(powerOn ? "Standby mode entered" : "Powering on display...");
    } else if (command === "VOLUME_UP") {
      setVolume(v => Math.min(100, v + 2));
      setIsMuted(false);
      setRecentNotification(`Volume ${Math.min(100, volume + 2)}%`);
    } else if (command === "VOLUME_DOWN") {
      setVolume(v => Math.max(0, v - 2));
      setIsMuted(false);
      setRecentNotification(`Volume ${Math.max(0, volume - 2)}%`);
    } else if (command === "SET_VOLUME" && typeof value === "number") {
      setVolume(value);
      setRecentNotification(`Volume ${value}%`);
    } else if (command === "MUTE") {
      setIsMuted(m => !m);
      setRecentNotification(isMuted ? "Audio Unmuted" : "Audio Muted");
    } else if (command === "HOME") {
      setCurrentApp("Google TV Home");
      setRecentNotification("Returned to Home Screen");
    } else if (command === "CHANNEL_UP") {
      setChannel(c => c + 1);
      setRecentNotification(`Switched to Channel ${channel + 1}`);
    } else if (command === "CHANNEL_DOWN") {
      setChannel(c => Math.max(1, c - 1));
      setRecentNotification(`Switched to Channel ${Math.max(1, channel - 1)}`);
    } else if (command === "LAUNCH_APP") {
      const appName = value?.includes("youtube")
        ? "YouTube"
        : value?.includes("netflix")
        ? "Netflix"
        : value?.includes("spotify")
        ? "Spotify"
        : value?.includes("prime")
        ? "Prime Video"
        : value || "Application";
      setCurrentApp(appName);
      setRecentNotification(`Launched ${appName}`);
    } else if (command === "TEXT_INPUT") {
      setSearchQuery(String(value || ""));
      setRecentNotification(`Voice Search: "${value}"`);
    } else if (command === "DPAD_UP") {
      if (navZone === "apps") {
        setNavZone("actions");
      }
      setRecentNotification("Navigated Up");
    } else if (command === "DPAD_DOWN") {
      if (navZone === "actions") {
        setNavZone("apps");
      }
      setRecentNotification("Navigated Down");
    } else if (command === "DPAD_LEFT") {
      if (navZone === "apps") {
        setFocusedAppIdx(prev => (prev > 0 ? prev - 1 : TV_APPS.length - 1));
      } else {
        setFocusedActionIdx(prev => (prev > 0 ? prev - 1 : 1));
      }
    } else if (command === "DPAD_RIGHT") {
      if (navZone === "apps") {
        setFocusedAppIdx(prev => (prev < TV_APPS.length - 1 ? prev + 1 : 0));
      } else {
        setFocusedActionIdx(prev => (prev < 1 ? prev + 1 : 0));
      }
    } else if (command === "DPAD_CENTER" || command === "ENTER") {
      if (navZone === "apps") {
        const app = TV_APPS[focusedAppIdx];
        if (app) {
          setCurrentApp(app.name);
          setRecentNotification(`Selected ${app.name}`);
        }
      } else if (navZone === "actions") {
        if (focusedActionIdx === 0) {
          if (onGeneratePin) onGeneratePin();
          setRecentNotification("Generated new TV Pairing PIN");
        } else {
          setShowManagePhones(true);
        }
      }
    } else if (command === "BACK") {
      if (showManagePhones) {
        setShowManagePhones(false);
      } else if (currentApp !== "Google TV Home") {
        setCurrentApp("Google TV Home");
        setRecentNotification("Exited App to Home");
      }
    } else {
      setRecentNotification(`Command: ${command}`);
    }

    const timer = setTimeout(() => {
      setRecentNotification(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [lastCommand, navZone, focusedAppIdx, focusedActionIdx, powerOn, volume, isMuted, channel, showManagePhones, currentApp, onGeneratePin]);

  // Physical Keyboard / D-Pad listener for 10-Foot TV Experience
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only capture navigation if not focused on text input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setNavZone("actions");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setNavZone("apps");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (navZone === "apps") {
        setFocusedAppIdx(prev => (prev > 0 ? prev - 1 : TV_APPS.length - 1));
      } else {
        setFocusedActionIdx(prev => (prev > 0 ? prev - 1 : 1));
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (navZone === "apps") {
        setFocusedAppIdx(prev => (prev < TV_APPS.length - 1 ? prev + 1 : 0));
      } else {
        setFocusedActionIdx(prev => (prev < 1 ? prev + 1 : 0));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (navZone === "apps") {
        const app = TV_APPS[focusedAppIdx];
        if (app) setCurrentApp(app.name);
      } else if (navZone === "actions") {
        if (focusedActionIdx === 0) {
          if (onGeneratePin) onGeneratePin();
        } else {
          setShowManagePhones(prev => !prev);
        }
      }
    } else if (e.key === "Escape" || e.key === "Backspace") {
      if (showManagePhones) {
        setShowManagePhones(false);
      } else if (currentApp !== "Google TV Home") {
        setCurrentApp("Google TV Home");
      }
    }
  }, [navZone, focusedAppIdx, focusedActionIdx, showManagePhones, currentApp, onGeneratePin]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const connectedPhoneCount = device?.isPaired ? 1 : 0;

  return (
    <div id="tv-receiver-app" className="w-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-indigo-500">
      
      {/* 1. 10-Foot TV Header */}
      <TvReceiverHeader
        device={device}
        powerOn={powerOn}
        connectedPhoneCount={connectedPhoneCount}
      />

      {/* 2. Main TV Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 sm:p-8 flex flex-col justify-center space-y-6">
        
        {!powerOn ? (
          /* Standby Screen */
          <div className="w-full aspect-video max-h-[600px] bg-black border-2 border-zinc-900 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 shadow-2xl">
            <div className="w-4 h-4 rounded-full bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
            <h2 className="text-2xl font-bold text-zinc-500 tracking-wider font-mono">
              STANDBY / SCREEN OFF
            </h2>
            <p className="text-sm text-zinc-600 max-w-sm text-center">
              Press the POWER button on your connected phone remote to wake this TV.
            </p>
            <button
              onClick={() => setPowerOn(true)}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 focus-visible:ring-indigo-400 hover:ring-2 hover:ring-indigo-400/50"
            >
              <Power className="w-4 h-4 text-emerald-400" />
              <span>Wake TV Display</span>
            </button>
          </div>
        ) : (
          /* Active 10-Foot TV Receiver Interface */
          <div className="space-y-6">
            
            {/* Live Search Bar Overlay if Text/Voice was entered from Remote */}
            {searchQuery && (
              <div className="bg-indigo-950/80 border-2 border-indigo-400 rounded-2xl p-4 flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center gap-3">
                  <Search className="w-6 h-6 text-indigo-300" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Search Query from Remote
                    </span>
                    <p className="text-lg font-bold text-white">"{searchQuery}"</p>
                  </div>
                </div>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-xs font-bold rounded-lg text-white outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 focus-visible:ring-indigo-300 transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* TV Pairing & QR Code Zone (Purpose-built 10-foot layout) */}
            <TvPairingQrCard
              device={device}
              pairingPin={pairingPin}
              connectedPhoneCount={connectedPhoneCount}
              focusedIndex={navZone === "actions" ? focusedActionIdx : -1}
              onSelectAction={(actionId) => {
                if (actionId === "PAIR_NEW" && onGeneratePin) {
                  onGeneratePin();
                  setRecentNotification("Generated new TV Pairing PIN");
                } else if (actionId === "MANAGE_DEVICES") {
                  setShowManagePhones(true);
                }
              }}
            />

            {/* Smart Apps & Input Carousel */}
            <TvAppGrid
              activeApp={currentApp}
              focusedAppIndex={navZone === "apps" ? focusedAppIdx : -1}
              onLaunchApp={(app: TvAppItem) => {
                setCurrentApp(app.name);
                setRecentNotification(`Launched ${app.name}`);
              }}
            />

            {/* 10-Foot Volume HUD & Live OSD Status */}
            <TvVolumeHud
              volume={volume}
              isMuted={isMuted}
              channel={channel}
              currentApp={currentApp}
              recentNotification={recentNotification}
              lastCommand={lastCommand}
            />

          </div>
        )}

      </main>

      {/* 3. 10-Foot Navigation Helper Footer */}
      <footer className="w-full bg-zinc-900/80 border-t border-zinc-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-indigo-300 font-bold">▲ ▼ ◀ ▶</kbd>
            <span>Navigate Screen</span>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300">
            <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-indigo-300 font-bold">ENTER</kbd>
            <span>Select / Launch</span>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300">
            <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-indigo-300 font-bold">ESC</kbd>
            <span>Back</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-500">
          <span>Google TV Receiver Service v2.0</span>
          <span>•</span>
          <span>Port 3000 WebSocket</span>
        </div>
      </footer>

      {/* Connected Phones Modal */}
      {showManagePhones && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Connected Mobile Remotes</h3>
              </div>
              <button
                onClick={() => setShowManagePhones(false)}
                className="text-zinc-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-zinc-800 outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 focus-visible:ring-indigo-400 transition-all"
              >
                Close (ESC)
              </button>
            </div>

            <div className="space-y-3 py-2">
              {device?.isPaired ? (
                <div className="p-4 bg-zinc-800/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <div>
                      <p className="font-bold text-sm text-zinc-100">Android Phone Controller</p>
                      <p className="text-xs text-zinc-400 font-mono">Token: {device.token?.substring(0, 16)}...</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/30">
                    AUTHORIZED
                  </span>
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-400 space-y-1 bg-zinc-950/60 rounded-2xl border border-zinc-800">
                  <p className="font-semibold text-zinc-200">No Authorized Phones Currently Paired</p>
                  <p className="text-xs text-zinc-500">Scan the QR code or use the pairing PIN to connect a phone.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowManagePhones(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 focus-visible:ring-indigo-300 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

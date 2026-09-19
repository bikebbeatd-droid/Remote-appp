import React from "react";
import { TvDevice, RemoteMode, RemoteCommandType, ConnectionState } from "../core/types";
import { MobileDeviceCard } from "./components/MobileDeviceCard";
import { MobileModeBar } from "./components/MobileModeBar";
import { ClassicRemote } from "../remotes/ClassicRemote";
import { TouchpadRemote } from "../remotes/TouchpadRemote";
import { DpadRemote } from "../remotes/DpadRemote";
import { MediaRemote } from "../remotes/MediaRemote";
import { KeyboardRemote } from "../remotes/KeyboardRemote";
import { NumpadRemote } from "../remotes/NumpadRemote";
import { AppLauncherRemote } from "../remotes/AppLauncherRemote";
import { GamingRemote } from "../remotes/GamingRemote";
import { AccessibilityRemote } from "../remotes/AccessibilityRemote";
import { Activity, Radio, ShieldCheck, Wifi } from "lucide-react";

interface MobileRemoteViewProps {
  device: TvDevice | null;
  connectionState: ConnectionState;
  currentMode: RemoteMode;
  onSelectMode: (mode: RemoteMode) => void;
  onSendCommand: (command: RemoteCommandType, value?: any) => Promise<boolean>;
  isSending: boolean;
  onOpenTvSelector: () => void;
  onOpenCapabilityMatrix: () => void;
  onOpenQrScanner?: () => void;
  onOpenPairing?: () => void;
  onOpenVoiceRemote: () => void;
  onOpenButtonMapper?: () => void;
  onOpenCustomBuilder?: () => void;
  onOpenLearnRemote?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenScenes?: () => void;
  onOpenShareProfile?: () => void;
  onOpenRemoteLibrary?: () => void;
  onOpenCompatibilityCenter?: () => void;
  onOpenIrBlaster?: () => void;
  onOpenDownloadApk?: () => void;
  onUnsupportedAttempt?: (reason: string) => void;
}

const connectionLabel: Record<ConnectionState, string> = {
  CONNECTED: "Connected",
  CONNECTING: "Connecting",
  DISCONNECTED: "Disconnected",
  ERROR: "Connection error"
};

export const MobileRemoteView: React.FC<MobileRemoteViewProps> = ({
  device,
  connectionState,
  currentMode,
  onSelectMode,
  onSendCommand,
  isSending,
  onOpenTvSelector,
  onOpenCapabilityMatrix,
  onOpenQrScanner,
  onOpenPairing,
  onOpenVoiceRemote,
  onOpenButtonMapper,
  onOpenCustomBuilder,
  onOpenLearnRemote,
  onOpenDiagnostics,
  onOpenScenes,
  onOpenShareProfile,
  onOpenRemoteLibrary,
  onOpenCompatibilityCenter,
  onOpenIrBlaster,
  onOpenDownloadApk,
  onUnsupportedAttempt
}) => {
  const connected = connectionState === "CONNECTED";
  const paired = Boolean(device?.isPaired);
  const controlLabel = connected ? "Online" : paired ? "Paired" : "Not paired";
  const linkLabel = connected ? "Live" : device ? "Saved" : "—";

  return (
    <main
      id="mobile-remote-container"
      className="w-full max-w-sm sm:max-w-md mx-auto px-3 sm:px-0 pb-10"
      aria-label="Universal TV remote"
    >
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/30">
        {/* Premium status header */}
        <header className="relative overflow-hidden px-4 pt-4 pb-3">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Universal Remote
              </p>
              <h1 className="mt-0.5 truncate text-base font-bold text-white">
                {device?.name || "No TV selected"}
              </h1>
            </div>
            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${connected
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : connectionState === "CONNECTING"
                  ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : connectionState === "CONNECTING" ? "bg-amber-400 animate-pulse" : "bg-zinc-600"}`} />
              {connectionLabel[connectionState] || connectionState}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="rounded-2xl border border-white/5 bg-white/[0.035] px-2.5 py-2">
              <Wifi className="h-3.5 w-3.5 text-cyan-300" />
              <p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">Link</p>
              <p className="text-[10px] font-medium text-zinc-200">{linkLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.035] px-2.5 py-2">
              <Radio className="h-3.5 w-3.5 text-indigo-300" />
              <p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">Mode</p>
              <p className="truncate text-[10px] font-medium capitalize text-zinc-200">{currentMode}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.035] px-2.5 py-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              <p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">Control</p>
              <p className="text-[10px] font-medium text-zinc-200">{controlLabel}</p>
            </div>
          </div>
        </header>

        {/* Device selector / management card */}
        <section className="px-3">
          <MobileDeviceCard
            device={device}
            connectionState={connectionState}
            onOpenTvSelector={onOpenTvSelector}
            onOpenVoiceRemote={onOpenVoiceRemote}
            onOpenCapabilityMatrix={onOpenCapabilityMatrix}
            onOpenQrScanner={onOpenQrScanner}
            onOpenPairing={onOpenPairing}
            onOpenDiagnostics={onOpenDiagnostics}
            onOpenButtonMapper={onOpenButtonMapper}
            onOpenCustomBuilder={onOpenCustomBuilder}
            onOpenLearnRemote={onOpenLearnRemote}
            onOpenScenes={onOpenScenes}
            onOpenShareProfile={onOpenShareProfile}
            onOpenRemoteLibrary={onOpenRemoteLibrary}
            onOpenCompatibilityCenter={onOpenCompatibilityCenter}
            onOpenIrBlaster={onOpenIrBlaster}
            onOpenDownloadApk={onOpenDownloadApk}
          />
        </section>

        {/* Mode switcher */}
        <section className="px-3 pt-3">
          <MobileModeBar currentMode={currentMode} onSelectMode={onSelectMode} />
        </section>

        {/* Remote surface */}
        <section
          id="mobile-remote-screen-body"
          className="px-3 pb-4 pt-3"
          aria-live="polite"
        >
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-2 shadow-inner shadow-white/[0.02]" role="region" aria-label={`${currentMode} remote controls`}>
            <div className="pointer-events-none absolute -right-16 top-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative">
              {currentMode === "classic" && <ClassicRemote device={device} onSendCommand={onSendCommand} isSending={isSending} onUnsupportedAttempt={onUnsupportedAttempt} />}
              {currentMode === "touchpad" && <TouchpadRemote device={device} onSendCommand={onSendCommand} onUnsupportedAttempt={onUnsupportedAttempt} />}
              {currentMode === "dpad" && <DpadRemote device={device} onSendCommand={onSendCommand} onUnsupportedAttempt={onUnsupportedAttempt} />}
              {currentMode === "media" && <MediaRemote device={device} onSendCommand={onSendCommand} onUnsupportedAttempt={onUnsupportedAttempt} />}
              {currentMode === "keyboard" && <KeyboardRemote device={device} onSendCommand={onSendCommand} onUnsupportedAttempt={onUnsupportedAttempt} />}
              {currentMode === "numpad" && <NumpadRemote device={device} onSendCommand={onSendCommand} onUnsupportedAttempt={onUnsupportedAttempt} />}
              {currentMode === "apps" && <AppLauncherRemote device={device} onSendCommand={onSendCommand} onUnsupportedAttempt={onUnsupportedAttempt} />}
              {currentMode === "gaming" && <GamingRemote device={device} onSendCommand={onSendCommand} onUnsupportedAttempt={onUnsupportedAttempt} />}
              {currentMode === "accessibility" && <AccessibilityRemote device={device} onSendCommand={onSendCommand} onUnsupportedAttempt={onUnsupportedAttempt} />}
            </div>
          </div>
        </section>

        {/* Small activity footer */}
        <footer className="flex items-center justify-center gap-2 border-t border-white/5 px-4 py-2.5 text-[9px] text-zinc-500">
          <Activity className="h-3 w-3" />
          <span>{connected ? "Commands use the selected transport." : "Connect a TV to send commands."}</span>
        </footer>
      </div>
    </main>
  );
};

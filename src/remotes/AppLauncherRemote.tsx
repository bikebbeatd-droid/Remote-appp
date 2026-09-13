import React from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { POPULAR_TV_APPS } from "../core/constants";
import { checkCommandSupport } from "../core/capabilities";
import { AppWindow, ExternalLink, AlertTriangle, CheckCircle2, PlaySquare } from "lucide-react";

interface AppLauncherRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const AppLauncherRemote: React.FC<AppLauncherRemoteProps> = ({
  device,
  onSendCommand,
  onUnsupportedAttempt
}) => {
  const isAppsSupported = device && device.capabilities.apps === "SUPPORTED";

  const handleLaunch = (app: typeof POPULAR_TV_APPS[0]) => {
    const check = checkCommandSupport(device, "LAUNCH_APP");
    if (!check.allowed) {
      onUnsupportedAttempt(check.reason || "App launch protocol not supported by this device.");
      return;
    }

    // Select targeted ID based on platform
    let targetAppId = app.appId;
    if (device?.platform === "roku" && app.rokuAppId) {
      targetAppId = app.rokuAppId;
    } else if (device?.platform === "tizen" && app.tizenAppId) {
      targetAppId = app.tizenAppId;
    } else if (device?.platform === "webos" && app.webOsAppId) {
      targetAppId = app.webOsAppId;
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(25); } catch {}
    }

    onSendCommand("LAUNCH_APP", targetAppId);
  };

  return (
    <div id="app-launcher-panel" className="flex flex-col items-center max-w-sm mx-auto w-full space-y-4 select-none">
      
      {/* Header status */}
      <div className="w-full flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
          <AppWindow className="w-4 h-4 text-indigo-400" />
          <span>Smart TV Applications</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
          isAppsSupported
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-amber-500/15 border-amber-500/30 text-amber-400"
        }`}>
          {isAppsSupported ? "Ready to Launch" : "Unavailable for TV"}
        </span>
      </div>

      {!isAppsSupported && (
        <div className="w-full p-3 bg-amber-950/40 border border-amber-800/80 rounded-2xl flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>This TV platform does not expose direct network application launching.</span>
        </div>
      )}

      {/* Grid of Apps */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {POPULAR_TV_APPS.map(app => (
          <button
            key={app.id}
            id={`launch-app-${app.id}`}
            onClick={() => handleLaunch(app)}
            disabled={!isAppsSupported}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all ${
              app.bgColor
            } hover:scale-[1.02] active:scale-95 disabled:opacity-40 shadow-md cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-base font-bold ${app.iconColor}`}>
                {app.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>{app.badge}</span>
              <span className="font-mono text-[9px] text-zinc-500 truncate max-w-[70px]">
                {device?.platform === "roku" ? `ID: ${app.rokuAppId}` : "Package"}
              </span>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
};

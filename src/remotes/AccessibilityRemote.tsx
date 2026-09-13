import React from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import { Power, Home, ArrowLeft, Volume2, VolumeX, CheckCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface AccessibilityRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const AccessibilityRemote: React.FC<AccessibilityRemoteProps> = ({
  device,
  onSendCommand,
  onUnsupportedAttempt
}) => {
  const handlePress = (command: RemoteCommandType, label: string) => {
    const check = checkCommandSupport(device, command);
    if (!check.allowed) {
      onUnsupportedAttempt(check.reason || "Command not supported on this TV");
      return;
    }

    // High haptic vibration for accessibility
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate([40, 30, 40]); } catch {}
    }

    onSendCommand(command);
  };

  return (
    <div id="accessibility-remote-panel" className="flex flex-col items-center max-w-sm mx-auto w-full space-y-4 select-none">
      
      <div className="w-full p-3 bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl text-xs text-amber-300 font-semibold text-center">
        Accessibility High-Contrast Mode • Large Touch Targets (64px+)
      </div>

      {/* High Contrast Power */}
      <button
        onClick={() => handlePress("POWER", "Power")}
        className="w-full h-16 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-lg flex items-center justify-center gap-3 border-2 border-rose-300 shadow-xl cursor-pointer"
      >
        <Power className="w-7 h-7 stroke-[2.5]" />
        <span>POWER ON / OFF</span>
      </button>

      {/* Navigation High Contrast OK & Arrows */}
      <div className="w-full space-y-2">
        <button
          onClick={() => handlePress("UP", "Up")}
          className="w-full h-16 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-extrabold text-base flex items-center justify-center gap-2 border-2 border-zinc-500"
        >
          <ChevronUp className="w-8 h-8" />
          <span>NAVIGATE UP</span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handlePress("LEFT", "Left")}
            className="h-16 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center border-2 border-zinc-500"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onClick={() => handlePress("OK", "Select")}
            className="h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-lg flex items-center justify-center border-2 border-indigo-300 shadow-lg"
          >
            SELECT
          </button>
          <button
            onClick={() => handlePress("RIGHT", "Right")}
            className="h-16 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center border-2 border-zinc-500"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>

        <button
          onClick={() => handlePress("DOWN", "Down")}
          className="w-full h-16 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-extrabold text-base flex items-center justify-center gap-2 border-2 border-zinc-500"
        >
          <ChevronDown className="w-8 h-8" />
          <span>NAVIGATE DOWN</span>
        </button>
      </div>

      {/* Large Volume & Mute */}
      <div className="w-full grid grid-cols-2 gap-3">
        <button
          onClick={() => handlePress("VOLUME_DOWN", "Volume Down")}
          className="h-16 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 border-2 border-zinc-500"
        >
          <span>VOL −</span>
        </button>
        <button
          onClick={() => handlePress("VOLUME_UP", "Volume Up")}
          className="h-16 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 border-2 border-zinc-500"
        >
          <span>VOL +</span>
        </button>
      </div>

      <button
        onClick={() => handlePress("MUTE", "Mute Audio")}
        className="w-full h-14 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 border-2 border-amber-500/50"
      >
        <VolumeX className="w-6 h-6" />
        <span>MUTE SOUND</span>
      </button>

      {/* Home and Back */}
      <div className="w-full grid grid-cols-2 gap-3">
        <button
          onClick={() => handlePress("HOME", "Home Screen")}
          className="h-16 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 border-2 border-sky-300 shadow-lg"
        >
          <Home className="w-6 h-6" />
          <span>HOME</span>
        </button>
        <button
          onClick={() => handlePress("BACK", "Go Back")}
          className="h-16 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 border-2 border-zinc-500 shadow-lg"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>BACK</span>
        </button>
      </div>

    </div>
  );
};

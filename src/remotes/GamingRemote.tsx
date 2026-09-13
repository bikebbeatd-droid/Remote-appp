import React from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import { Gamepad2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home, Menu, ArrowLeft } from "lucide-react";

interface GamingRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const GamingRemote: React.FC<GamingRemoteProps> = ({
  device,
  onSendCommand,
  onUnsupportedAttempt
}) => {
  const handlePress = (command: RemoteCommandType, value?: any) => {
    const check = checkCommandSupport(device, command);
    if (!check.allowed) {
      onUnsupportedAttempt(check.reason || "Command not supported on this TV");
      return;
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(25); } catch {}
    }
    onSendCommand(command, value);
  };

  return (
    <div id="gaming-remote-panel" className="flex flex-col items-center max-w-md mx-auto w-full space-y-6 select-none">
      
      {/* Shoulder Bumpers L1 / R1 */}
      <div className="w-full flex items-center justify-between px-2 gap-4">
        <button
          id="game-btn-l1"
          onClick={() => handlePress("VOLUME_DOWN")}
          className="flex-1 py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 active:scale-95 text-xs font-bold text-zinc-300 rounded-t-2xl shadow-md transition-all"
        >
          L1 (Vol −)
        </button>
        <button
          id="game-btn-r1"
          onClick={() => handlePress("VOLUME_UP")}
          className="flex-1 py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 active:scale-95 text-xs font-bold text-zinc-300 rounded-t-2xl shadow-md transition-all"
        >
          R1 (Vol +)
        </button>
      </div>

      {/* Main Dual Controller Layout */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-3 sm:p-5 shadow-2xl flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Left Thumb: Directional D-Pad */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
          <button
            onClick={() => handlePress("UP")}
            className="absolute top-0 w-9 sm:w-12 h-10 sm:h-14 bg-zinc-800 border border-zinc-700 rounded-t-xl active:bg-indigo-600 active:scale-95 flex items-center justify-center text-zinc-200"
          >
            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => handlePress("DOWN")}
            className="absolute bottom-0 w-9 sm:w-12 h-10 sm:h-14 bg-zinc-800 border border-zinc-700 rounded-b-xl active:bg-indigo-600 active:scale-95 flex items-center justify-center text-zinc-200"
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => handlePress("LEFT")}
            className="absolute left-0 w-10 sm:w-14 h-9 sm:h-12 bg-zinc-800 border border-zinc-700 rounded-l-xl active:bg-indigo-600 active:scale-95 flex items-center justify-center text-zinc-200"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => handlePress("RIGHT")}
            className="absolute right-0 w-10 sm:w-14 h-9 sm:h-12 bg-zinc-800 border border-zinc-700 rounded-r-xl active:bg-indigo-600 active:scale-95 flex items-center justify-center text-zinc-200"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-zinc-950 rounded-lg flex items-center justify-center pointer-events-none z-10" />
        </div>

        {/* Center Start / Select */}
        <div className="flex flex-col gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => handlePress("BACK")}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-zinc-800 border border-zinc-700 active:scale-90 flex items-center justify-center text-zinc-300 text-[9px] sm:text-[10px] font-bold shadow-md"
            title="Select / Back"
          >
            SEL
          </button>
          <button
            onClick={() => handlePress("HOME")}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-indigo-600 active:scale-90 flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold shadow-md"
            title="Start / Home"
          >
            START
          </button>
        </div>

        {/* Right Thumb: ABXY Action Buttons */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
          {/* Y (Top) */}
          <button
            onClick={() => handlePress("MENU")}
            className="absolute top-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 active:scale-90 text-amber-400 font-extrabold text-xs sm:text-base flex items-center justify-center shadow-md"
          >
            Y
          </button>
          {/* A (Bottom - OK) */}
          <button
            onClick={() => handlePress("OK")}
            className="absolute bottom-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-90 text-emerald-400 font-extrabold text-xs sm:text-base flex items-center justify-center shadow-md"
          >
            A
          </button>
          {/* X (Left - Info) */}
          <button
            onClick={() => handlePress("INFO")}
            className="absolute left-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-sky-500/20 border border-sky-500/40 hover:bg-sky-500/30 active:scale-90 text-sky-400 font-extrabold text-xs sm:text-base flex items-center justify-center shadow-md"
          >
            X
          </button>
          {/* B (Right - Back) */}
          <button
            onClick={() => handlePress("BACK")}
            className="absolute right-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 active:scale-90 text-rose-400 font-extrabold text-xs sm:text-base flex items-center justify-center shadow-md"
          >
            B
          </button>
        </div>

      </div>

    </div>
  );
};

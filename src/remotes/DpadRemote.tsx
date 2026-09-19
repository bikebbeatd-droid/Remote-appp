import React from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Home,
  Menu,
  Volume2,
  VolumeX,
  Tv
} from "lucide-react";

interface DpadRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const DpadRemote: React.FC<DpadRemoteProps> = ({
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
      try { navigator.vibrate(20); } catch {}
    }
    onSendCommand(command, value);
  };

  return (
    <div id="dpad-remote-panel" className="flex flex-col items-center max-w-xs mx-auto w-full space-y-6 select-none">
      
      {/* Top action row */}
      <div className="w-full grid grid-cols-3 gap-2">
        <button
          id="dpad-btn-back"
          onClick={() => handlePress("BACK")}
          disabled={!device}
          className="py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-xs font-medium text-zinc-300 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          id="dpad-btn-home"
          onClick={() => handlePress("HOME")}
          disabled={!device}
          className="py-3 bg-indigo-950/50 border border-indigo-500/40 hover:bg-indigo-900/60 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-xs font-medium text-indigo-300 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          id="dpad-btn-menu"
          onClick={() => handlePress("MENU")}
          disabled={!device}
          className="py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-xs font-medium text-zinc-300 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </div>

      {/* Cross D-Pad */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Up button */}
        <button
          id="dpad-cross-up"
          onClick={() => handlePress("UP")}
          disabled={!device}
          className="absolute top-0 w-20 h-24 bg-zinc-900 border border-zinc-800 rounded-t-3xl hover:bg-zinc-800 active:bg-indigo-600/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-zinc-200 shadow-lg transition-all"
          title="Up"
        >
          <ChevronUp className="w-8 h-8 -mt-4" />
        </button>

        {/* Down button */}
        <button
          id="dpad-cross-down"
          onClick={() => handlePress("DOWN")}
          disabled={!device}
          className="absolute bottom-0 w-20 h-24 bg-zinc-900 border border-zinc-800 rounded-b-3xl hover:bg-zinc-800 active:bg-indigo-600/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-zinc-200 shadow-lg transition-all"
          title="Down"
        >
          <ChevronDown className="w-8 h-8 mt-4" />
        </button>

        {/* Left button */}
        <button
          id="dpad-cross-left"
          onClick={() => handlePress("LEFT")}
          disabled={!device}
          className="absolute left-0 w-24 h-20 bg-zinc-900 border border-zinc-800 rounded-l-3xl hover:bg-zinc-800 active:bg-indigo-600/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-zinc-200 shadow-lg transition-all"
          title="Left"
        >
          <ChevronLeft className="w-8 h-8 -ml-4" />
        </button>

        {/* Right button */}
        <button
          id="dpad-cross-right"
          onClick={() => handlePress("RIGHT")}
          disabled={!device}
          className="absolute right-0 w-24 h-20 bg-zinc-900 border border-zinc-800 rounded-r-3xl hover:bg-zinc-800 active:bg-indigo-600/30 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-zinc-200 shadow-lg transition-all"
          title="Right"
        >
          <ChevronRight className="w-8 h-8 mr-4" />
        </button>

        {/* Center OK button */}
        <button
          id="dpad-cross-center"
          onClick={() => handlePress("OK")}
          disabled={!device}
          className="w-20 h-20 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-90 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-lg shadow-xl shadow-indigo-600/30 border-2 border-indigo-400/40 z-10 transition-all"
          title="OK / Select"
        >
          OK
        </button>
      </div>

      {/* Bottom Volume & Mute Row */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-inner">
        <button
          id="dpad-vol-down"
          onClick={() => handlePress("VOLUME_DOWN")}
          disabled={!device}
          className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-zinc-200 rounded-xl text-xs font-semibold transition-all"
        >
          VOL −
        </button>
        <button
          id="dpad-mute"
          onClick={() => handlePress("MUTE")}
          disabled={!device}
          className="p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-amber-400 rounded-xl transition-all"
          title="Mute"
        >
          <VolumeX className="w-4 h-4" />
        </button>
        <button
          id="dpad-vol-up"
          onClick={() => handlePress("VOLUME_UP")}
          disabled={!device}
          className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-xl text-xs font-semibold transition-all"
        >
          VOL +
        </button>
      </div>

    </div>
  );
};

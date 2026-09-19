import React from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import {
  Power,
  Tv,
  Home,
  ArrowLeft,
  Menu,
  Volume2,
  VolumeX,
  Volume1,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Square,
  SkipBack,
  SkipForward,
  Info,
  Maximize2
} from "lucide-react";

interface ClassicRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  isSending: boolean;
  onUnsupportedAttempt: (reason: string) => void;
}

export const ClassicRemote: React.FC<ClassicRemoteProps> = ({
  device,
  onSendCommand,
  isSending,
  onUnsupportedAttempt
}) => {
  const handlePress = (command: RemoteCommandType, value?: any) => {
    const check = checkCommandSupport(device, command);
    if (!check.allowed) {
      onUnsupportedAttempt(check.reason || "Command not supported on this TV");
      return;
    }
    // Trigger vibration if available
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(25); } catch {}
    }
    onSendCommand(command, value);
  };

  const isPowerDisabled = !device || device.capabilities.power === "UNSUPPORTED";
  const isNavDisabled = !device || device.capabilities.navigation === "UNSUPPORTED";
  const isVolDisabled = !device || device.capabilities.volume === "UNSUPPORTED";
  const isMediaDisabled = !device || device.capabilities.media === "UNSUPPORTED";
  const isInputDisabled = !device || device.capabilities.input === "UNSUPPORTED";

  return (
    <div id="classic-remote-panel" className="flex flex-col items-center max-w-xs mx-auto w-full space-y-6 select-none">
      
      {/* Top Controls: Power, Input/Source, Mute */}
      <div className="w-full flex items-center justify-between px-1 sm:px-2 gap-2">
        <button
          id="remote-btn-power"
          onClick={() => handlePress("POWER")}
          disabled={isPowerDisabled}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-950/40 border border-rose-600/40 hover:bg-rose-900/60 active:scale-95 disabled:opacity-30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 shrink-0"
          title="Power Toggle"
        >
          <Power className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          id="remote-btn-input"
          onClick={() => handlePress("INPUT")}
          disabled={isInputDisabled}
          className="flex-1 max-w-[120px] h-12 rounded-xl bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300 transition-all shadow-md cursor-pointer"
          title="Source / HDMI Input"
        >
          <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          <span>Input</span>
        </button>

        <button
          id="remote-btn-mute"
          onClick={() => handlePress("MUTE")}
          disabled={isVolDisabled}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-300 transition-all shadow-md cursor-pointer shrink-0"
          title="Mute Audio"
        >
          <VolumeX className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* Rockers Row: Volume & Channel */}
      <div className="w-full flex items-center justify-between px-1 sm:px-2 gap-2 sm:gap-4">
        {/* Volume Rocker */}
        <div className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1 sm:p-1.5 flex flex-col items-center shadow-inner">
          <button
            id="remote-btn-vol-up"
            onClick={() => handlePress("VOLUME_UP")}
            disabled={isVolDisabled}
            className="w-full h-12 sm:h-14 rounded-xl hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 font-bold text-lg"
            title="Volume +"
          >
            +
          </button>
          <div className="py-1.5 sm:py-2 text-[10px] uppercase tracking-widest font-semibold text-zinc-500 flex items-center gap-1">
            <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400" />
            <span>Vol</span>
          </div>
          <button
            id="remote-btn-vol-down"
            onClick={() => handlePress("VOLUME_DOWN")}
            disabled={isVolDisabled}
            className="w-full h-12 sm:h-14 rounded-xl hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 font-bold text-lg"
            title="Volume -"
          >
            −
          </button>
        </div>

        {/* Center Utilities: Home & Back */}
        <div className="flex flex-col gap-2.5 sm:gap-3 shrink-0">
          <button
            id="remote-btn-home"
            onClick={() => handlePress("HOME")}
            disabled={isNavDisabled}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 hover:bg-indigo-900/70 active:scale-95 disabled:opacity-30 flex items-center justify-center text-indigo-300 shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            title="Home Screen"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            id="remote-btn-back"
            onClick={() => handlePress("BACK")}
            disabled={isNavDisabled}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-300 shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            title="Back / Return"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Channel Rocker */}
        <div className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1 sm:p-1.5 flex flex-col items-center shadow-inner">
          <button
            id="remote-btn-ch-up"
            onClick={() => handlePress("CHANNEL_UP")}
            disabled={!device || device.capabilities.channels === "UNSUPPORTED"}
            className="w-full h-12 sm:h-14 rounded-xl hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            title="Channel Up"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <div className="py-1.5 sm:py-2 text-[10px] uppercase tracking-widest font-semibold text-zinc-500">
            CH
          </div>
          <button
            id="remote-btn-ch-down"
            onClick={() => handlePress("CHANNEL_DOWN")}
            disabled={!device || device.capabilities.channels === "UNSUPPORTED"}
            className="w-full h-12 sm:h-14 rounded-xl hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            title="Channel Down"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* D-Pad Circular Controller */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-zinc-900 border-2 border-zinc-800 shadow-2xl flex items-center justify-center p-2 mx-auto">
        {/* Up */}
        <button
          id="remote-btn-dpad-up"
          onClick={() => handlePress("UP")}
          disabled={isNavDisabled}
          className="absolute top-1 sm:top-2 w-24 sm:w-28 h-16 sm:h-[4.5rem] rounded-t-full hover:bg-zinc-800/90 active:bg-indigo-600/30 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          title="Navigate Up"
        >
          <ChevronUp className="w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3 text-zinc-200" />
        </button>

        {/* Down */}
        <button
          id="remote-btn-dpad-down"
          onClick={() => handlePress("DOWN")}
          disabled={isNavDisabled}
          className="absolute bottom-1 sm:bottom-2 w-24 sm:w-28 h-16 sm:h-[4.5rem] rounded-b-full hover:bg-zinc-800/90 active:bg-indigo-600/30 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          title="Navigate Down"
        >
          <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7 mt-2 sm:mt-3 text-zinc-200" />
        </button>

        {/* Left */}
        <button
          id="remote-btn-dpad-left"
          onClick={() => handlePress("LEFT")}
          disabled={isNavDisabled}
          className="absolute left-1 sm:left-2 w-16 sm:w-[4.5rem] h-24 sm:h-28 rounded-l-full hover:bg-zinc-800/90 active:bg-indigo-600/30 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          title="Navigate Left"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 mr-2 sm:mr-3 text-zinc-200" />
        </button>

        {/* Right */}
        <button
          id="remote-btn-dpad-right"
          onClick={() => handlePress("RIGHT")}
          disabled={isNavDisabled}
          className="absolute right-1 sm:right-2 w-16 sm:w-[4.5rem] h-24 sm:h-28 rounded-r-full hover:bg-zinc-800/90 active:bg-indigo-600/30 active:scale-95 disabled:opacity-30 flex items-center justify-center text-zinc-300 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          title="Navigate Right"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 ml-2 sm:ml-3 text-zinc-200" />
        </button>

        {/* Center OK / Select */}
        <button
          id="remote-btn-ok"
          onClick={() => handlePress("OK")}
          disabled={isNavDisabled}
          className="w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-90 active:bg-indigo-700 disabled:opacity-30 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/30 border-2 border-indigo-400/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 z-10"
          title="OK / Select"
        >
          OK
        </button>
      </div>

      {/* Auxiliary Row: Menu, Info, Exit */}
      <div className="w-full grid grid-cols-3 gap-2 px-1">
        <button
          id="remote-btn-menu"
          onClick={() => handlePress("MENU")}
          disabled={isNavDisabled}
          className="py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          title="Context Menu"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>

        <button
          id="remote-btn-info"
          onClick={() => handlePress("INFO")}
          disabled={isNavDisabled}
          className="py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          title="Program Info"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Info</span>
        </button>

        <button
          id="remote-btn-exit"
          onClick={() => handlePress("EXIT")}
          disabled={isNavDisabled}
          className="py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center"
          title="Exit"
        >
          Exit
        </button>
      </div>

      {/* Media Playback Controls */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 shadow-inner">
        <div className="grid grid-cols-5 gap-2 text-zinc-300">
          <button
            id="remote-btn-rewind"
            onClick={() => handlePress("REWIND")}
            disabled={isMediaDisabled}
            className="h-10 rounded-xl hover:bg-zinc-800 active:scale-95 disabled:opacity-30 flex items-center justify-center transition-all"
            title="Rewind"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <button
            id="remote-btn-play"
            onClick={() => handlePress("PLAY")}
            disabled={isMediaDisabled}
            className="h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/50 active:scale-95 disabled:opacity-30 flex items-center justify-center transition-all"
            title="Play"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
          <button
            id="remote-btn-pause"
            onClick={() => handlePress("PAUSE")}
            disabled={isMediaDisabled}
            className="h-10 rounded-xl hover:bg-zinc-800 active:scale-95 disabled:opacity-30 flex items-center justify-center transition-all"
            title="Pause"
          >
            <Pause className="w-4 h-4" />
          </button>
          <button
            id="remote-btn-stop"
            onClick={() => handlePress("STOP")}
            disabled={isMediaDisabled}
            className="h-10 rounded-xl hover:bg-zinc-800 active:scale-95 disabled:opacity-30 flex items-center justify-center transition-all"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            id="remote-btn-forward"
            onClick={() => handlePress("FAST_FORWARD")}
            disabled={isMediaDisabled}
            className="h-10 rounded-xl hover:bg-zinc-800 active:scale-95 disabled:opacity-30 flex items-center justify-center transition-all"
            title="Fast Forward"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Color Keys: only enabled when the verified capability layer allows them */}
      <div className="w-full flex items-center justify-between px-2 gap-2">
        <button
          id="remote-btn-red"
          onClick={() => handlePress("COLOR_RED")}
          disabled={!device || device.capabilities.navigation === "UNSUPPORTED"}
          className="flex-1 h-3.5 rounded-full bg-rose-500 hover:opacity-90 active:scale-95 disabled:opacity-30 transition-all shadow-sm"
          title="Red"
        />
        <button
          id="remote-btn-green"
          onClick={() => handlePress("COLOR_GREEN")}
          disabled={!device || device.capabilities.navigation === "UNSUPPORTED"}
          className="flex-1 h-3.5 rounded-full bg-emerald-500 hover:opacity-90 active:scale-95 disabled:opacity-30 transition-all shadow-sm"
          title="Green"
        />
        <button
          id="remote-btn-yellow"
          onClick={() => handlePress("COLOR_YELLOW")}
          disabled={!device || device.capabilities.navigation === "UNSUPPORTED"}
          className="flex-1 h-3.5 rounded-full bg-amber-400 hover:opacity-90 active:scale-95 disabled:opacity-30 transition-all shadow-sm"
          title="Yellow"
        />
        <button
          id="remote-btn-blue"
          onClick={() => handlePress("COLOR_BLUE")}
          disabled={!device || device.capabilities.navigation === "UNSUPPORTED"}
          className="flex-1 h-3.5 rounded-full bg-sky-500 hover:opacity-90 active:scale-95 disabled:opacity-30 transition-all shadow-sm"
          title="Blue"
        />
      </div>

    </div>
  );
};

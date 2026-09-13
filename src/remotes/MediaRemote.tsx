import React, { useState } from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Sliders,
  Tv
} from "lucide-react";

interface MediaRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const MediaRemote: React.FC<MediaRemoteProps> = ({
  device,
  onSendCommand,
  onUnsupportedAttempt
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(24);

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

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    handlePress(isPlaying ? "PAUSE" : "PLAY");
  };

  const handleVolumeChange = (newVal: number) => {
    setVolumeLevel(newVal);
    handlePress("SET_VOLUME", newVal);
  };

  return (
    <div id="media-remote-panel" className="flex flex-col items-center max-w-xs mx-auto w-full space-y-6 select-none">
      
      {/* Media Playing Status Card */}
      <div className="w-full p-4 bg-gradient-to-br from-indigo-950/40 to-zinc-900 border border-indigo-500/20 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Live Media Playback</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">4K HDR</span>
        </div>

        {/* Mock scrubber representation */}
        <div className="space-y-1 pt-1">
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full w-2/5" />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>42:15</span>
            <span>1:52:00</span>
          </div>
        </div>
      </div>

      {/* Main Transport Disc: Giant Play/Pause button */}
      <div className="flex items-center justify-center gap-6">
        <button
          id="media-btn-rewind-10"
          onClick={() => handlePress("REWIND")}
          className="w-13 h-13 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-300 flex items-center justify-center shadow-lg transition-all"
          title="Skip Backward 10s"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          id="media-btn-play-pause-toggle"
          onClick={togglePlayPause}
          className="w-22 h-22 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 border-2 border-indigo-400/40 transition-all cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>

        <button
          id="media-btn-forward-10"
          onClick={() => handlePress("FAST_FORWARD")}
          className="w-13 h-13 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-300 flex items-center justify-center shadow-lg transition-all"
          title="Skip Forward 10s"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {/* Chapter Track Skip */}
      <div className="w-full grid grid-cols-2 gap-3">
        <button
          id="media-btn-prev-track"
          onClick={() => handlePress("PREVIOUS")}
          className="py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-xs font-medium text-zinc-300 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <SkipBack className="w-4 h-4" />
          <span>Previous</span>
        </button>
        <button
          id="media-btn-next-track"
          onClick={() => handlePress("NEXT")}
          className="py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-xs font-medium text-zinc-300 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <span>Next</span>
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Volume Slider Card */}
      <div className="w-full p-4 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-2 shadow-inner">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Master Volume</span>
          </span>
          <span className="font-mono text-zinc-200">{volumeLevel}%</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePress("MUTE")}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 rounded-lg transition-colors"
            title="Mute"
          >
            <VolumeX className="w-4 h-4" />
          </button>
          <input
            id="media-volume-slider"
            type="range"
            min="0"
            max="100"
            value={volumeLevel}
            onChange={e => handleVolumeChange(parseInt(e.target.value, 10))}
            className="flex-1 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

    </div>
  );
};

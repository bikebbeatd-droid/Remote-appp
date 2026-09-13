import React, { useState } from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import { Hash, RotateCcw, CornerDownLeft, ChevronUp, ChevronDown } from "lucide-react";

interface NumpadRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const NumpadRemote: React.FC<NumpadRemoteProps> = ({
  device,
  onSendCommand,
  onUnsupportedAttempt
}) => {
  const [digitBuffer, setDigitBuffer] = useState<string>("");

  const handlePress = (command: RemoteCommandType, value?: any) => {
    const check = checkCommandSupport(device, command);
    if (!check.allowed) {
      onUnsupportedAttempt(check.reason || "Channel tuner commands not supported on this TV.");
      return;
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(20); } catch {}
    }
    onSendCommand(command, value);
  };

  const handleDigit = (num: number) => {
    const newBuf = (digitBuffer + num).slice(0, 4);
    setDigitBuffer(newBuf);
    const commandName = `NUMBER_${num}` as RemoteCommandType;
    handlePress(commandName, num);
  };

  const handleTuneChannel = () => {
    if (digitBuffer) {
      const chNum = parseInt(digitBuffer, 10);
      handlePress("SET_CHANNEL", chNum);
      setDigitBuffer("");
    }
  };

  const handleClear = () => {
    setDigitBuffer("");
  };

  return (
    <div id="numpad-remote-panel" className="flex flex-col items-center max-w-xs mx-auto w-full space-y-5 select-none">
      
      {/* Channel Display Monitor */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            Channel Tuner
          </span>
          <div className="text-2xl font-mono font-bold text-indigo-300">
            {digitBuffer || "--"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {digitBuffer && (
            <button
              onClick={handleClear}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleTuneChannel}
            disabled={!digitBuffer}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm"
          >
            Tune
          </button>
        </div>
      </div>

      {/* 3x4 Number Grid */}
      <div className="w-full grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            id={`numpad-btn-${num}`}
            onClick={() => handleDigit(num)}
            className="h-16 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:bg-indigo-600/30 active:scale-95 text-xl font-bold text-zinc-200 flex items-center justify-center transition-all shadow-md cursor-pointer"
          >
            {num}
          </button>
        ))}

        {/* Dash (-) */}
        <button
          id="numpad-btn-dash"
          onClick={() => handlePress("DASH")}
          className="h-16 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-xl font-bold text-zinc-400 flex items-center justify-center transition-all shadow-md cursor-pointer"
        >
          —
        </button>

        {/* 0 */}
        <button
          id="numpad-btn-0"
          onClick={() => handleDigit(0)}
          className="h-16 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:bg-indigo-600/30 active:scale-95 text-xl font-bold text-zinc-200 flex items-center justify-center transition-all shadow-md cursor-pointer"
        >
          0
        </button>

        {/* Previous Channel */}
        <button
          id="numpad-btn-prev-ch"
          onClick={() => handlePress("PREV_CHANNEL")}
          className="h-16 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-xs font-semibold text-zinc-400 flex flex-col items-center justify-center gap-1 transition-all shadow-md cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>PREV</span>
        </button>
      </div>

      {/* Channel Rocker Row */}
      <div className="w-full grid grid-cols-2 gap-3 pt-2">
        <button
          id="numpad-ch-down"
          onClick={() => handlePress("CHANNEL_DOWN")}
          className="py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-xs font-semibold text-zinc-300 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <ChevronDown className="w-4 h-4" />
          <span>Channel Down</span>
        </button>
        <button
          id="numpad-ch-up"
          onClick={() => handlePress("CHANNEL_UP")}
          className="py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-xs font-semibold text-zinc-300 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <ChevronUp className="w-4 h-4" />
          <span>Channel Up</span>
        </button>
      </div>

    </div>
  );
};

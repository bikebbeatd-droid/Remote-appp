import React, { useState, useRef } from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { checkCommandSupport } from "../core/capabilities";
import { MousePointer, Sliders, AlertTriangle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft } from "lucide-react";

interface TouchpadRemoteProps {
  device: TvDevice | null;
  onSendCommand: (command: RemoteCommandType, value?: any) => void;
  onUnsupportedAttempt: (reason: string) => void;
}

export const TouchpadRemote: React.FC<TouchpadRemoteProps> = ({
  device,
  onSendCommand,
  onUnsupportedAttempt
}) => {
  const [sensitivity, setSensitivity] = useState(1.2);
  const [lastGesture, setLastGesture] = useState<string>("Ready");
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const startTime = useRef<number>(0);
  const hasMoved = useRef<boolean>(false);

  const isTouchpadSupported = device && device.capabilities.touchpad === "SUPPORTED";

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchpadSupported) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    startPos.current = { x, y };
    startTime.current = Date.now();
    hasMoved.current = false;
    setTouchPos({ x, y });

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(10); } catch {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchpadSupported || !startPos.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTouchPos({ x, y });

    const dx = (x - startPos.current.x) * sensitivity;
    const dy = (y - startPos.current.y) * sensitivity;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 35 && !hasMoved.current) {
      hasMoved.current = true;
      // Determine dominant direction
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          setLastGesture("Swipe Right");
          onSendCommand("RIGHT");
        } else {
          setLastGesture("Swipe Left");
          onSendCommand("LEFT");
        }
      } else {
        if (dy > 0) {
          setLastGesture("Swipe Down");
          onSendCommand("DOWN");
        } else {
          setLastGesture("Swipe Up");
          onSendCommand("UP");
        }
      }

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(15); } catch {}
      }

      // Reset startPos for continuous swiping
      startPos.current = { x, y };
    }
  };

  const handlePointerUp = () => {
    if (!isTouchpadSupported) return;
    const duration = Date.now() - startTime.current;

    // Single Tap detection
    if (!hasMoved.current && duration < 350) {
      setLastGesture("Tap (Select)");
      onSendCommand("OK");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(25); } catch {}
      }
    }

    startPos.current = null;
    setTouchPos(null);
  };

  if (!isTouchpadSupported) {
    return (
      <div id="touchpad-unsupported-view" className="max-w-xs mx-auto w-full p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl text-center space-y-4">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 text-base">Touchpad isn't supported by this TV.</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            The target platform ({device?.platform.toUpperCase() || "TV"}) does not support pointer/touch navigation over this protocol.
          </p>
        </div>
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-left text-xs text-zinc-400 space-y-1.5">
          <p className="text-zinc-300 font-medium">Why is this disabled?</p>
          <p className="text-[11px] text-zinc-500">
            Per the capability-based architecture, controls are not faked. Please switch to the <strong>Classic Remote</strong> or <strong>D-Pad</strong> mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="touchpad-remote-panel" className="flex flex-col items-center max-w-xs mx-auto w-full space-y-4 select-none">
      
      {/* Top HUD: Gesture readout & Sensitivity */}
      <div className="w-full flex items-center justify-between px-2 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium text-indigo-300">
          <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gesture: <strong>{lastGesture}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] text-zinc-500">Sensitivity:</span>
          <input
            id="touchpad-sensitivity-slider"
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={sensitivity}
            onChange={e => setSensitivity(parseFloat(e.target.value))}
            className="w-16 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Touch Surface Pad */}
      <div
        id="touchpad-surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full h-80 bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-zinc-800 rounded-3xl shadow-2xl flex items-center justify-center cursor-crosshair overflow-hidden touch-none"
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Center Helper Indicator */}
        <div className="text-center space-y-1 pointer-events-none z-0">
          <MousePointer className="w-8 h-8 text-zinc-600 mx-auto opacity-40" />
          <p className="text-xs text-zinc-500 font-medium">Swipe to Navigate • Tap to Select</p>
          <p className="text-[10px] text-zinc-600">Pointer protocol active</p>
        </div>

        {/* Directional arrow cues */}
        <ArrowUp className="absolute top-3 w-4 h-4 text-zinc-700 pointer-events-none" />
        <ArrowDown className="absolute bottom-3 w-4 h-4 text-zinc-700 pointer-events-none" />
        <ArrowLeft className="absolute left-3 w-4 h-4 text-zinc-700 pointer-events-none" />
        <ArrowRight className="absolute right-3 w-4 h-4 text-zinc-700 pointer-events-none" />

        {/* Finger pointer ripple */}
        {touchPos && (
          <div
            className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-indigo-500/20 border border-indigo-400/40 pointer-events-none animate-ping"
            style={{ left: touchPos.x, top: touchPos.y }}
          />
        )}
      </div>

      {/* Quick Action Bar under Touchpad */}
      <div className="w-full grid grid-cols-3 gap-2">
        <button
          id="touchpad-quick-back"
          onClick={() => onSendCommand("BACK")}
          className="py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300 rounded-xl active:scale-95 transition-all"
        >
          Back
        </button>
        <button
          id="touchpad-quick-home"
          onClick={() => onSendCommand("HOME")}
          className="py-2.5 bg-indigo-950/60 border border-indigo-500/30 hover:bg-indigo-900/60 text-xs font-medium text-indigo-300 rounded-xl active:scale-95 transition-all"
        >
          Home
        </button>
        <button
          id="touchpad-quick-ok"
          onClick={() => onSendCommand("OK")}
          className="py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1"
        >
          <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400" />
          <span>Enter</span>
        </button>
      </div>

    </div>
  );
};

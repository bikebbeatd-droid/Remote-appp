import React, { useState, useEffect } from "react";
import { AppLogo } from "./AppLogo";
import { ArrowRight, Sparkles, Wifi, Shield, Cpu } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  minDurationMs = 1400
}) => {
  const [progress, setProgress] = useState(12);
  const [phaseText, setPhaseText] = useState("Initializing Universal Remote Core...");
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / minDurationMs) * 100));
      setProgress(pct);

      if (pct < 35) {
        setPhaseText("Initializing Multi-Protocol Hardware Engine...");
      } else if (pct < 70) {
        setPhaseText("Checking Wi-Fi, mDNS & SSDP Multicast Adapters...");
      } else if (pct < 95) {
        setPhaseText("Loading Smart TV Profiles (Android TV, Tizen, webOS, Roku)...");
      } else {
        setPhaseText("Universal Remote System Ready!");
      }

      if (elapsed >= minDurationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [minDurationMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 150);
  };

  return (
    <div
      id="app-loading-screen"
      className={`fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-6 transition-opacity duration-300 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Loading Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        
        {/* App Logo Display with Glow */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-[36px] blur-xl opacity-50 group-hover:opacity-75 transition duration-500" />
          <AppLogo size="2xl" animated={true} />
        </div>

        {/* Title & Brand Headline */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Universal Smart TV Remote
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            Next-Gen TV Controller & 10-Foot Studio
          </p>
        </div>

        {/* High-Tech Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-indigo-300 font-medium flex items-center gap-1.5 truncate pr-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />
              <span className="truncate">{phaseText}</span>
            </span>
            <span className="text-zinc-400 font-bold shrink-0">{progress}%</span>
          </div>

          <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 rounded-full transition-all duration-75 shadow-lg shadow-cyan-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Protocols & Capabilities Badge Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-zinc-400 font-mono">
          <span className="px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center gap-1">
            <Wifi className="w-3 h-3 text-indigo-400" /> Wi-Fi LAN
          </span>
          <span className="px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> Multi-Protocol
          </span>
          <span className="px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" /> Local Encrypted
          </span>
        </div>

        {/* Quick Skip Button */}
        <div className="pt-4">
          <button
            id="loading-skip-btn"
            onClick={handleSkip}
            className="px-5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 text-xs font-semibold border border-zinc-800 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Skip to Remote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Footer Info */}
      <div className="absolute bottom-4 text-[11px] text-zinc-400 font-mono">
        Universal Smart TV Remote Platform v2.5
      </div>
    </div>
  );
};

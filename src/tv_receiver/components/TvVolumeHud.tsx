import React from "react";
import { Volume2, VolumeX, Radio, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

interface TvVolumeHudProps {
  volume: number;
  isMuted: boolean;
  channel: number;
  currentApp: string;
  recentNotification: string | null;
  lastCommand: { command: string; value?: any; timestamp: string } | null;
}

export const TvVolumeHud: React.FC<TvVolumeHudProps> = ({
  volume,
  isMuted,
  channel,
  currentApp,
  recentNotification,
  lastCommand
}) => {
  return (
    <div className="w-full bg-zinc-950/90 border-2 border-zinc-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Active Broadcast Channel / Stream Details */}
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-300 uppercase">Live Output</span>
            <span className="text-sm font-black text-white">{currentApp}</span>
          </div>
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-400">
            TV Channel: <strong className="text-zinc-200">CH {channel}</strong>
          </div>
        </div>

        {/* 10-Foot Volume Bar HUD */}
        <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-5 py-2.5 rounded-2xl shadow-lg">
          {isMuted ? (
            <div className="flex items-center gap-2 text-rose-400">
              <VolumeX className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-black tracking-wider">AUDIO MUTED</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              <div className="w-40 sm:w-56 h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-150"
                  style={{ width: `${volume}%` }}
                />
              </div>
              <span className="text-sm font-mono font-bold text-zinc-100 min-w-[40px]">
                {volume}%
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Real-time Notification Banner & Live Command Echo */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-850">
        <div className="flex items-center gap-2">
          {recentNotification ? (
            <div className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
              <CheckCircle className="w-4 h-4" />
              <span>{recentNotification}</span>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              TV Receiver Engine Ready • 10-Foot Screen Active
            </span>
          )}
        </div>

        {lastCommand && (
          <div className="text-xs font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800 flex items-center gap-2">
            <span className="text-indigo-400 font-bold">Latest Remote Ingress:</span>
            <span className="text-white font-semibold">{lastCommand.command}</span>
            {lastCommand.value !== undefined && (
              <span className="text-zinc-400">({JSON.stringify(lastCommand.value)})</span>
            )}
            <span className="text-[10px] text-zinc-500">[{lastCommand.timestamp}]</span>
          </div>
        )}
      </div>

    </div>
  );
};

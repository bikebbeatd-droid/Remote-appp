import React, { useState } from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { Film, Gamepad2, Moon, Music, Play, CheckCircle2, Plus, Trash2, X, Sparkles } from "lucide-react";

interface SceneStep {
  command: RemoteCommandType;
  value?: any;
  delayMs: number;
  label: string;
}

interface SmartScene {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  steps: SceneStep[];
}

interface ScenesModalProps {
  device: TvDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (cmd: RemoteCommandType, val?: any) => Promise<boolean>;
}

const PRESET_SCENES: SmartScene[] = [
  {
    id: "movie_night",
    name: "Movie Night",
    description: "Launches streaming, tunes volume, readies media playback",
    icon: "Film",
    color: "from-purple-900/40 to-indigo-900/20 border-purple-500/40 text-purple-300",
    steps: [
      { command: "POWER", delayMs: 400, label: "Wake TV" },
      { command: "LAUNCH_APP", value: "com.netflix.ninja", delayMs: 1200, label: "Launch Netflix" },
      { command: "SET_VOLUME", value: 30, delayMs: 300, label: "Set Volume to 30%" }
    ]
  },
  {
    id: "gaming_mode",
    name: "Console Gaming",
    description: "Switches TV source directly to HDMI 1 input for low latency",
    icon: "Gamepad2",
    color: "from-emerald-900/40 to-teal-900/20 border-emerald-500/40 text-emerald-300",
    steps: [
      { command: "POWER", delayMs: 400, label: "Wake TV" },
      { command: "INPUT", delayMs: 800, label: "Switch HDMI Input" }
    ]
  },
  {
    id: "bedtime_shutdown",
    name: "Bedtime Off",
    description: "Silences audio and turns off television securely",
    icon: "Moon",
    color: "from-blue-900/40 to-zinc-900/20 border-blue-500/40 text-blue-300",
    steps: [
      { command: "MUTE", delayMs: 300, label: "Mute Audio" },
      { command: "POWER", delayMs: 600, label: "Send Standby Command" }
    ]
  },
  {
    id: "chill_music",
    name: "Background Music",
    description: "Opens music player and dials comfortable ambient sound",
    icon: "Music",
    color: "from-amber-900/40 to-rose-900/20 border-amber-500/40 text-amber-300",
    steps: [
      { command: "POWER", delayMs: 400, label: "Wake TV" },
      { command: "LAUNCH_APP", value: "com.spotify.tv.android", delayMs: 1200, label: "Launch Spotify" },
      { command: "SET_VOLUME", value: 18, delayMs: 300, label: "Comfortable Audio 18%" }
    ]
  }
];

export const ScenesModal: React.FC<ScenesModalProps> = ({
  device,
  isOpen,
  onClose,
  onExecuteCommand
}) => {
  const [scenes, setScenes] = useState<SmartScene[]>(PRESET_SCENES);
  const [runningSceneId, setRunningSceneId] = useState<string | null>(null);
  const [currentStepLabel, setCurrentStepLabel] = useState<string | null>(null);

  if (!isOpen) return null;

  const executeScene = async (scene: SmartScene) => {
    setRunningSceneId(scene.id);
    const steps = scene.steps || [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStepLabel(`Step ${i + 1}/${steps.length}: ${step.label}`);
      await onExecuteCommand(step.command, step.value);
      await new Promise(r => setTimeout(r, step.delayMs || 300));
    }

    setCurrentStepLabel("Scene completed successfully!");
    setTimeout(() => {
      setRunningSceneId(null);
      setCurrentStepLabel(null);
    }, 1500);
  };

  return (
    <div id="scenes-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="scenes-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Smart Automation & Scenes</h3>
              <p className="text-xs text-zinc-400">One-tap multi-command sequences for your living room</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {currentStepLabel && (
            <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 font-medium flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{currentStepLabel}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenes.map(scene => {
              const isRunning = runningSceneId === scene.id;
              return (
                <div
                  key={scene.id}
                  className={`p-4 rounded-2xl border bg-gradient-to-br transition-all flex flex-col justify-between h-44 shadow-lg ${scene.color}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-sm text-zinc-100">{scene.name}</h4>
                      <span className="text-[10px] font-mono opacity-70">
                        {(scene.steps || []).length} Steps
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2">
                      {scene.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Target: {device?.name || "TV"}
                    </span>
                    <button
                      onClick={() => executeScene(scene)}
                      disabled={!!runningSceneId}
                      className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 disabled:opacity-50 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isRunning ? (
                        <span className="animate-spin text-sm">⏳</span>
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>{isRunning ? "Running..." : "Activate"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

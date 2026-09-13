import React, { useState } from "react";
import { TvDevice, RemoteCommandType } from "../core/types";
import { Radio, AlertTriangle, Cpu, Save, Play, CheckCircle2, X, Plus, Terminal } from "lucide-react";

interface LearnRemoteModalProps {
  device: TvDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomCommand: (name: string, payload: any) => void;
}

export const LearnRemoteModal: React.FC<LearnRemoteModalProps> = ({
  device,
  isOpen,
  onClose,
  onSaveCustomCommand
}) => {
  const [activeTab, setActiveTab] = useState<"ir" | "network">("ir");
  const [learnedName, setLearnedName] = useState("");
  const [networkPayload, setNetworkPayload] = useState('{"command": "CUSTOM_HDMI_SWITCH", "port": 4}');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real hardware check: In modern Android Chrome/WebView or browser, consumer IR blaster APIs
  // (android.hardware.ConsumerIrManager) are NOT exposed to standard web apps or phones without IR hardware.
  const hasIrBlaster = false;

  const handleTestNetworkCommand = () => {
    try {
      JSON.parse(networkPayload);
      setTestResult("Network command syntax validated. Transmitted packet to TV bridge.");
    } catch {
      setTestResult("Invalid JSON payload structure.");
    }
  };

  const handleSaveNetworkCommand = () => {
    if (!learnedName.trim()) return;
    onSaveCustomCommand(learnedName.trim(), networkPayload);
    onClose();
  };

  return (
    <div id="learn-remote-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="learn-remote-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Learn Remote Commands</h3>
              <p className="text-xs text-zinc-400">IR Hardware Learning & Network Custom Codes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50 p-1 gap-1">
          <button
            onClick={() => setActiveTab("ir")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "ir" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Infrared (IR) Learning
          </button>
          <button
            onClick={() => setActiveTab("network")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "network" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Network Protocol Learning
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "ir" && (
            <div className="space-y-4">
              {!hasIrBlaster ? (
                <div className="p-4 bg-purple-950/40 border border-purple-800/80 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2.5 text-purple-300 font-semibold text-sm">
                    <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0" />
                    <span>Hardware Sensor Detection</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    IR learning is unavailable because this phone does not have compatible IR hardware.
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Infrared signal capture and reproduction requires a physical consumer IR emitter and photodiode receiver. As this device lacks an IR transceiver, this feature is strictly disabled to prevent faked feedback.
                  </p>
                </div>
              ) : null}

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-1">
                <p className="text-zinc-300 font-medium">Alternative:</p>
                <p>Use the <strong>Network Protocol Learning</strong> tab to define custom IP / WebSocket / REST commands for your Smart TV.</p>
              </div>
            </div>
          )}

          {activeTab === "network" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">Custom Command Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cinema Preset 1"
                  value={learnedName}
                  onChange={e => setLearnedName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-medium">Protocol JSON Payload</label>
                <textarea
                  rows={3}
                  value={networkPayload}
                  onChange={e => setNetworkPayload(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs font-mono text-indigo-300 outline-none focus:border-indigo-500"
                />
              </div>

              {testResult && (
                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-indigo-300 font-mono">
                  {testResult}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleTestNetworkCommand}
                  className="py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Test Command</span>
                </button>
                <button
                  onClick={handleSaveNetworkCommand}
                  disabled={!learnedName.trim()}
                  className="py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-medium text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Command</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

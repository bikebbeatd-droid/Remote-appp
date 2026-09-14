import React from "react";
import { TvDevice, CapabilityStatus, DeviceCapabilities } from "../core/types";
import { CAPABILITY_LABELS, getCapabilityBadgeColor } from "../core/capabilities";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  Cpu,
  X,
  Info,
  Sliders,
  Tv
} from "lucide-react";

interface CapabilityMatrixModalProps {
  device: TvDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPairing?: () => void;
  onOpenProtocolDocs?: () => void;
}

const CAPABILITY_DESCRIPTIONS: Record<keyof DeviceCapabilities, { desc: string; hardwareNote?: string }> = {
  power: { desc: "Power on, power off, or toggle standby state over network or CEC." },
  navigation: { desc: "Directional D-Pad (Up, Down, Left, Right), Select/OK, Back, Home, and Menu." },
  volume: { desc: "Increment, decrement, mute, and direct volume percentage control." },
  media: { desc: "Play, pause, stop, rewind, fast forward, skip next and previous track." },
  keyboard: { desc: "Send typed strings, search queries, backspace, and submit via phone virtual keyboard." },
  touchpad: { desc: "Mouse pointer navigation, swipe gestures, and tap-to-select commands." },
  apps: { desc: "Direct deep-linking and launching of YouTube, Netflix, Disney+, Plex, etc." },
  input: { desc: "Switching HDMI sources (HDMI 1, HDMI 2, Consoles, Live TV, AV)." },
  voice: { desc: "Speech-to-text recognition through phone microphone converted into TV search." },
  channels: { desc: "Tuner channel up/down and direct numerical number pad entry." },
  ir: { desc: "Direct consumer infrared optical pulse transmission.", hardwareNote: "Requires physical IR blaster hardware on phone." },
  bluetooth: { desc: "Bluetooth Low Energy HID remote control profile.", hardwareNote: "Requires Web Bluetooth pairing." },
  wifi: { desc: "Local network IP communication over Wi-Fi / Ethernet." }
};

export const CapabilityMatrixModal: React.FC<CapabilityMatrixModalProps> = ({
  device,
  isOpen,
  onClose,
  onOpenPairing,
  onOpenProtocolDocs
}) => {
  if (!isOpen || !device) return null;

  const caps = Object.keys(device.capabilities) as Array<keyof DeviceCapabilities>;

  const getStatusIcon = (status: CapabilityStatus) => {
    switch (status) {
      case "SUPPORTED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "UNSUPPORTED":
        return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case "REQUIRES_PAIRING":
        return <Lock className="w-4 h-4 text-amber-400 shrink-0" />;
      case "REQUIRES_HARDWARE":
        return <Cpu className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0" />;
    }
  };

  return (
    <div id="capability-matrix-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="capability-matrix-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Device Capability Matrix</h3>
              <p className="text-xs text-zinc-400">
                {device.name} ({device.platform.toUpperCase()} via {device.protocol})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenProtocolDocs && (
              <button
                onClick={() => {
                  onClose();
                  onOpenProtocolDocs();
                }}
                className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Full Protocol Specs</span>
              </button>
            )}
            <button
              id="close-cap-matrix-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-zinc-950 px-5 py-3 border-b border-zinc-800/80 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-zinc-400 font-medium">Status Legend:</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Supported
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <XCircle className="w-3.5 h-3.5" /> Unsupported
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <Lock className="w-3.5 h-3.5" /> Requires Pairing
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <Cpu className="w-3.5 h-3.5" /> Requires Hardware
          </span>
        </div>

        {/* Matrix List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-zinc-800/70">
          {caps.map(cap => {
            const status = device.capabilities[cap];
            const badge = getCapabilityBadgeColor(status);
            const info = CAPABILITY_DESCRIPTIONS[cap];

            return (
              <div key={cap} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="font-medium text-zinc-200 text-sm">{CAPABILITY_LABELS[cap]}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                      {status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 pl-6">{info.desc}</p>
                  {info.hardwareNote && status === "REQUIRES_HARDWARE" && (
                    <p className="text-[11px] text-purple-300 pl-6 font-mono">⚠️ {info.hardwareNote}</p>
                  )}
                </div>

                {status === "REQUIRES_PAIRING" && !device.isPaired && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPairing();
                    }}
                    className="self-start sm:self-center px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                  >
                    Pair Device
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            UI controls for unsupported capabilities are visibly disabled rather than faked.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

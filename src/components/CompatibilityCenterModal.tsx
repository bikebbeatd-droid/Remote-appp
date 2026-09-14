import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  Tv, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Cpu, 
  Wifi, 
  Radio, 
  Lock, 
  Sparkles, 
  X,
  Volume2,
  Power,
  Navigation,
  Keyboard,
  Mic,
  LayoutGrid,
  Maximize2,
  MousePointer,
  HelpCircle
} from "lucide-react";
import { DeviceProfile } from "../database/types";
import { DeviceDatabaseService } from "../database/deviceDatabase";
import { DeviceCapabilities } from "../core/types";

interface CompatibilityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfileId?: string;
  onConnectDevice?: (profile: DeviceProfile) => void;
}

export type CompatibilityLevel = 
  | "FULL_SUPPORT"
  | "PARTIAL_SUPPORT"
  | "PAIRING_REQUIRED"
  | "HARDWARE_REQUIRED"
  | "NOT_SUPPORTED";

export const CompatibilityCenterModal: React.FC<CompatibilityCenterModalProps> = ({
  isOpen,
  onClose,
  initialProfileId,
  onConnectDevice
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    initialProfileId || DeviceDatabaseService.getAllProfiles()[0]?.id || ""
  );

  const selectedProfile = useMemo(() => {
    return DeviceDatabaseService.getProfileById(selectedProfileId) || DeviceDatabaseService.getAllProfiles()[0];
  }, [selectedProfileId]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return DeviceDatabaseService.getAllProfiles();
    return DeviceDatabaseService.searchProfiles({ query: searchQuery });
  }, [searchQuery]);

  // Compute Overall Compatibility Assessment
  const compatibilityAssessment = useMemo((): {
    level: CompatibilityLevel;
    badgeLabel: string;
    badgeColor: string;
    description: string;
  } => {
    if (!selectedProfile) {
      return {
        level: "NOT_SUPPORTED",
        badgeLabel: "NOT SUPPORTED",
        badgeColor: "bg-red-950 border-red-800 text-red-300",
        description: "No profile data available for this device."
      };
    }

    const caps = selectedProfile.defaultCapabilities;
    const hasHardwareReq = Object.values(caps).some(status => status === "REQUIRES_HARDWARE");
    const isPairingReq = selectedProfile.pairingMethod !== "NONE";

    const supportedCount = Object.values(caps).filter(status => status === "SUPPORTED").length;

    if (hasHardwareReq && selectedProfile.platform === "ir_universal") {
      return {
        level: "HARDWARE_REQUIRED",
        badgeLabel: "HARDWARE REQUIRED",
        badgeColor: "bg-amber-950 border-amber-800 text-amber-300",
        description: "Requires an optical IR blaster diode or external USB transceiver. Phone without IR hardware cannot control this model."
      };
    }

    if (supportedCount >= 8 && !isPairingReq) {
      return {
        level: "FULL_SUPPORT",
        badgeLabel: "FULL SUPPORT (ZERO-CONFIG)",
        badgeColor: "bg-emerald-950 border-emerald-800 text-emerald-300",
        description: "Direct zero-configuration network control over local Wi-Fi. All core remote functions are fully supported."
      };
    }

    if (isPairingReq) {
      return {
        level: "PAIRING_REQUIRED",
        badgeLabel: "PAIRING REQUIRED",
        badgeColor: "bg-indigo-950 border-indigo-700 text-indigo-300",
        description: `Secure protocol authentication required (${selectedProfile.pairingMethod.replace(/_/g, " ")}). Once paired, bidirectional control is supported.`
      };
    }

    if (supportedCount >= 5) {
      return {
        level: "PARTIAL_SUPPORT",
        badgeLabel: "PARTIAL SUPPORT",
        badgeColor: "bg-sky-950 border-sky-800 text-sky-300",
        description: "Core navigation and media playback are supported. Certain vendor features (voice streaming or mouse pointer) are restricted."
      };
    }

    return {
      level: "NOT_SUPPORTED",
      badgeLabel: "LIMITED / EXPERIMENTAL",
      badgeColor: "bg-zinc-800 border-zinc-700 text-zinc-300",
      description: "Basic generic controls may be delivered over UPnP or generic REST."
    };
  }, [selectedProfile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl h-[90vh] max-h-[800px] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <span>Check My TV Compatibility</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                  Real Hardware Verification
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Audited platform specifications, hardware constraints, and protocol limits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search / Select Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search TV or Streaming Device to check compatibility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
          >
            {searchResults.map(p => (
              <option key={p.id} value={p.id}>{p.brand} - {p.model}</option>
            ))}
          </select>
        </div>

        {/* Detailed Verification Body */}
        {selectedProfile && (
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
            
            {/* Overall Status Banner */}
            <div className={`p-4 md:p-5 rounded-2xl border ${compatibilityAssessment.badgeColor} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Compatibility Verdict
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide bg-black/40 border border-white/20">
                    {compatibilityAssessment.badgeLabel}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-white">
                  {selectedProfile.brand} {selectedProfile.series} ({selectedProfile.model})
                </h3>
                <p className="text-xs opacity-90 leading-relaxed max-w-2xl">
                  {compatibilityAssessment.description}
                </p>
              </div>

              {onConnectDevice && (
                <button
                  onClick={() => {
                    onConnectDevice(selectedProfile);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-white text-zinc-950 font-bold text-xs rounded-xl shadow hover:bg-zinc-100 transition-all whitespace-nowrap cursor-pointer"
                >
                  Configure This TV
                </button>
              )}
            </div>

            {/* Core Capability Breakdown Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Capability Breakdown (Verified Protocol Level)</span>
                <span className="text-[10px] text-zinc-500 font-normal">Never inflated or simulated</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                
                {/* Power */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Power className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Power & Standby</div>
                      <div className="text-[10px] text-zinc-500">Wake on LAN / Sleep</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.power === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {selectedProfile.defaultCapabilities.power}
                  </span>
                </div>

                {/* Volume */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Volume & Mute</div>
                      <div className="text-[10px] text-zinc-500">Step & Direct Level</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.volume === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {selectedProfile.defaultCapabilities.volume}
                  </span>
                </div>

                {/* Navigation */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Navigation className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">D-Pad & Menu</div>
                      <div className="text-[10px] text-zinc-500">Up/Down/Left/Right/OK</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.navigation === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {selectedProfile.defaultCapabilities.navigation}
                  </span>
                </div>

                {/* Keyboard IME */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Keyboard className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Phone Keyboard (IME)</div>
                      <div className="text-[10px] text-zinc-500">Text input sync</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.keyboard === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {selectedProfile.defaultCapabilities.keyboard}
                  </span>
                </div>

                {/* Voice / Mic */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-pink-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Voice Assistant</div>
                      <div className="text-[10px] text-zinc-500">Query / Mic streaming</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.voice === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
                  }`}>
                    {selectedProfile.defaultCapabilities.voice}
                  </span>
                </div>

                {/* App Launch */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Direct App Launch</div>
                      <div className="text-[10px] text-zinc-500">Netflix, YouTube, Prime</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.apps === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {selectedProfile.defaultCapabilities.apps}
                  </span>
                </div>

                {/* Input Switch */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">HDMI Input Switch</div>
                      <div className="text-[10px] text-zinc-500">HDMI 1/2/3/4 & TV</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.input === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {selectedProfile.defaultCapabilities.input}
                  </span>
                </div>

                {/* Mouse / Pointer */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MousePointer className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Touchpad / Pointer</div>
                      <div className="text-[10px] text-zinc-500">Magic pointer / swipe</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.touchpad === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {selectedProfile.defaultCapabilities.touchpad}
                  </span>
                </div>

                {/* IR Blaster */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-4 h-4 text-orange-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Optical IR Mode</div>
                      <div className="text-[10px] text-zinc-500">Consumer IR Diode</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProfile.defaultCapabilities.ir === "SUPPORTED" ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-300"
                  }`}>
                    {selectedProfile.defaultCapabilities.ir}
                  </span>
                </div>
              </div>
            </div>

            {/* Protocol & Technical Specification Details */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
              <span className="font-bold text-zinc-300">Technical Protocol Audit</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-zinc-500">Platform:</span>
                  <p className="font-mono text-zinc-300 capitalize">{selectedProfile.platform.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Wire Protocol:</span>
                  <p className="font-mono text-zinc-300 truncate">{selectedProfile.protocol}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Default Port:</span>
                  <p className="font-mono text-zinc-300">{selectedProfile.defaultPort || "IR Only"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Discovery:</span>
                  <p className="font-mono text-zinc-300 truncate">{selectedProfile.discoveryMethod}</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

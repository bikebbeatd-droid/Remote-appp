import React, { useState } from "react";
import { PLATFORM_SPECS, PlatformProtocolDoc } from "../docs/platformSpecs";
import {
  BookOpen,
  X,
  Tv,
  CheckCircle2,
  XCircle,
  Shield,
  Radio,
  Settings,
  Smartphone,
  Server,
  Layers,
  HelpCircle,
  Sliders
} from "lucide-react";

interface PlatformProtocolDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlatform?: string;
}

export const PlatformProtocolDocsModal: React.FC<PlatformProtocolDocsModalProps> = ({
  isOpen,
  onClose,
  initialPlatform = "android_tv"
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialPlatform);

  if (!isOpen) return null;

  const currentSpec: PlatformProtocolDoc = PLATFORM_SPECS[selectedPlatform] || PLATFORM_SPECS.android_tv;
  const platformKeys = Object.keys(PLATFORM_SPECS);

  return (
    <div id="protocol-docs-backdrop" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div id="protocol-docs-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 text-lg sm:text-xl flex items-center gap-2">
                TV Protocol & Capability Documentation
              </h2>
              <p className="text-xs text-zinc-400">
                Researched discovery, transport, authentication, & command matrix per OS
              </p>
            </div>
          </div>
          <button
            id="close-protocol-docs-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {platformKeys.map((key) => {
            const spec = PLATFORM_SPECS[key];
            const isSelected = selectedPlatform === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedPlatform(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                {spec.name.split("(")[0].trim()}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-zinc-300 text-sm">
          
          {/* Top Platform Overview */}
          <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-zinc-100">{currentSpec.name}</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {currentSpec.vendor}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">
                  {currentSpec.marketShare}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{currentSpec.summary}</p>
          </div>

          {/* Discovery & Pairing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Discovery Method */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <Radio className="w-4 h-4" /> Discovery Protocol
              </div>
              <div className="text-xs space-y-1.5 text-zinc-300">
                <p><strong className="text-zinc-200">Protocol:</strong> {currentSpec.discoveryMethod.protocol}</p>
                <p><strong className="text-zinc-200">Target Service:</strong> <code className="bg-zinc-900 px-1 py-0.5 rounded font-mono text-[11px] text-emerald-300">{currentSpec.discoveryMethod.targetService}</code></p>
                <p><strong className="text-zinc-200">Ports:</strong> {currentSpec.discoveryMethod.ports.join(", ")}</p>
                <p className="text-zinc-400 text-[11px] pt-1 leading-normal">{currentSpec.discoveryMethod.details}</p>
              </div>
            </div>

            {/* Pairing & Auth */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Security & Pairing Handshake
              </div>
              <div className="text-xs space-y-1.5 text-zinc-300">
                <p><strong className="text-zinc-200">Auth Type:</strong> <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 text-[11px] font-semibold">{currentSpec.pairingAuthMethod.type}</span></p>
                <p><strong className="text-zinc-200">Token Lifetime:</strong> {currentSpec.pairingAuthMethod.tokenLifetime}</p>
                <p className="text-zinc-400 text-[11px] pt-1 leading-normal">{currentSpec.pairingAuthMethod.handshakeDescription}</p>
              </div>
            </div>
          </div>

          {/* Supported & Unsupported Feature Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" /> Protocol Feature Matrix
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(currentSpec.supportedFeatures).map(([featureKey, val]) => (
                <div key={featureKey} className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/70 flex items-start gap-2.5 text-xs">
                  {val.supported ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200 capitalize">{featureKey}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${val.supported ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                        {val.supported ? "SUPPORTED" : "UNSUPPORTED"}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">{val.method}</p>
                    {val.notes && <p className="text-amber-400 text-[10px] font-mono">⚠️ {val.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required TV Settings & Phone Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TV Settings */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <Settings className="w-4 h-4" /> Required TV Settings
              </div>
              <div className="space-y-2 text-xs">
                {currentSpec.requiredTvSettings.map((setting, idx) => (
                  <div key={idx} className="border-l-2 border-indigo-500/50 pl-2.5 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200">{setting.setting}</span>
                      {setting.mandatory ? (
                        <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded font-bold">REQUIRED</span>
                      ) : (
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded">OPTIONAL</span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-300 font-mono">{setting.path}</p>
                    <p className="text-[11px] text-zinc-400">{setting.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Permissions & Honest Unsupported Reasons */}
            <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4" /> Phone OS Permissions
              </div>
              <div className="space-y-2 text-xs">
                {currentSpec.requiredPhonePermissions.map((perm, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="font-mono text-purple-300 text-[11px]">{perm.permission}</p>
                    <p className="text-zinc-400 text-[11px]">{perm.reason}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <div className="text-rose-400 font-semibold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Honest Protocol Constraints
                </div>
                {currentSpec.unsupportedFeatures.map((item, idx) => (
                  <div key={idx} className="text-[11px] text-zinc-400 space-y-0.5">
                    <strong className="text-rose-300">{item.feature}:</strong> {item.technicalReason}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Protocol Endpoints & Wire Specs */}
          <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
              <Server className="w-4 h-4" /> Wire Protocol Endpoints
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {currentSpec.protocolEndpoints.map((ep, idx) => (
                <div key={idx} className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 space-y-1">
                  <div className="font-semibold text-zinc-200 text-xs">{ep.name}</div>
                  <code className="text-[10px] text-sky-300 font-mono block break-all">{ep.urlOrPort}</code>
                  <p className="text-[10px] text-zinc-400">{ep.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Compliant with official platform specifications and capability-driven adapter architecture.
          </span>
          <button
            id="close-protocol-docs-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors"
          >
            Close Specs
          </button>
        </div>

      </div>
    </div>
  );
};

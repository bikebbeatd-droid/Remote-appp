import React, { useState } from "react";
import { TvDevice, ButtonMapping } from "../core/types";
import { Share2, Download, Upload, Copy, CheckCircle2, X, FileText, ShieldAlert } from "lucide-react";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices?: TvDevice[];
  mappings?: ButtonMapping[];
  onImportProfile: (imported: { devices?: TvDevice[]; mappings?: ButtonMapping[] }) => void;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  isOpen,
  onClose,
  devices = [],
  mappings = [],
  onImportProfile
}) => {
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeDevices = Array.isArray(devices) ? devices : [];
  const safeMappings = Array.isArray(mappings) ? mappings : [];

  const profileData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    devices: safeDevices.map(d => ({
      id: d.id,
      name: d.name,
      platform: d.platform,
      ip: d.ip,
      port: d.port,
      protocol: d.protocol,
      capabilities: d.capabilities,
      isFavorite: d.isFavorite
      // tokens excluded for security
    })),
    mappings: safeMappings
  };

  const jsonString = JSON.stringify(profileData, null, 2);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tv-remote-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      onImportProfile(parsed);
      setImportStatus("Profile successfully imported! Devices and mappings synced.");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setImportStatus("Error: Invalid JSON format.");
    }
  };

  return (
    <div id="share-profile-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="share-profile-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Remote Profile & Backup</h3>
              <p className="text-xs text-zinc-400">Export, import or share TV layouts & configurations</p>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Export Box */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Export Remote Profile</h4>
                <p className="text-[11px] text-zinc-400">Includes {safeDevices.length} TVs and {safeMappings.length} custom button mappings</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl flex items-center gap-1 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800/80 text-[10px] text-zinc-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sensitive auth tokens and session keys are sanitized from export data.</span>
            </div>
          </div>

          {/* Import Box */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">Import Remote Profile</h4>
              <p className="text-[11px] text-zinc-400">Paste an exported profile JSON payload below</p>
            </div>

            <textarea
              rows={4}
              placeholder='{"version": "1.0", "devices": [...] }'
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs font-mono text-zinc-300 outline-none focus:border-indigo-500"
            />

            {importStatus && (
              <div className="p-2 bg-indigo-950/60 border border-indigo-500/40 rounded-lg text-xs text-indigo-300">
                {importStatus}
              </div>
            )}

            <button
              onClick={handleExecuteImport}
              disabled={!importJson.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import & Sync Devices</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

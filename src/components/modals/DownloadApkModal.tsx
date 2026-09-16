import React, { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  X,
  FileCode2,
  RefreshCw,
  HardDrive
} from "lucide-react";

export interface ReleaseMetadata {
  version: string;
  tagName: string;
  name: string;
  downloadUrl: string;
  fileName: string;
  size?: number;
  sizeFormatted?: string;
  publishedAt?: string;
  checksum?: string;
  releasePageUrl: string;
  isAvailable: boolean;
  signingStatus?: string;
}

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({
  isOpen,
  onClose
}) => {
  const [release, setRelease] = useState<ReleaseMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadStarted, setDownloadStarted] = useState<boolean>(false);
  const [copiedChecksum, setCopiedChecksum] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReleaseInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/releases/latest");
      if (res.ok) {
        const data = await res.json();
        setRelease(data);
      } else {
        // Fallback default
        setRelease({
          version: "1.0.0",
          tagName: "v1.0.0",
          name: "Remote-appp v1.0.0",
          downloadUrl: "https://github.com/bikebbeatd-droid/Remote-appp/releases/latest",
          fileName: "Remote-appp-v1.0.0.apk",
          releasePageUrl: "https://github.com/bikebbeatd-droid/Remote-appp/releases/latest",
          isAvailable: true,
          signingStatus: "Official Release"
        });
      }
    } catch {
      setRelease({
        version: "1.0.0",
        tagName: "v1.0.0",
        name: "Remote-appp v1.0.0",
        downloadUrl: "https://github.com/bikebbeatd-droid/Remote-appp/releases/latest",
        fileName: "Remote-appp-v1.0.0.apk",
        releasePageUrl: "https://github.com/bikebbeatd-droid/Remote-appp/releases/latest",
        isAvailable: true,
        signingStatus: "Official Release"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReleaseInfo();
      setDownloadStarted(false);
      setDownloading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadClick = () => {
    if (!release) return;

    setDownloading(true);
    setDownloadStarted(false);

    try {
      const link = document.createElement("a");
      link.href = release.downloadUrl;
      link.setAttribute("download", release.fileName || `Remote-appp-v${release.version}.apk`);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloading(false);
        setDownloadStarted(true);
      }, 1000);
    } catch {
      setDownloading(false);
      setError("Unable to start download automatically. Tap 'View on GitHub Releases' below.");
    }
  };

  const copyChecksum = () => {
    if (release?.checksum) {
      navigator.clipboard.writeText(release.checksum);
      setCopiedChecksum(true);
      setTimeout(() => setCopiedChecksum(false), 2000);
    }
  };

  return (
    <div
      id="download-apk-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="download-apk-modal-card"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-zinc-900 to-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-zinc-100">Download Android App</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  APK Binary
                </span>
              </div>
              <p className="text-xs text-zinc-400">Official Android Package Release</p>
            </div>
          </div>
          <button
            id="close-download-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-zinc-400">Fetching latest release info from GitHub...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-2xl flex items-start gap-3 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
                <a
                  href={release?.releasePageUrl || "https://github.com/bikebbeatd-droid/Remote-appp/releases"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-indigo-300 underline font-medium"
                >
                  Go to GitHub Releases <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : release ? (
            <>
              {/* Release Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400">Latest Release</span>
                    <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                      <span>{release.name || `v${release.version}`}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {release.tagName || `v${release.version}`}
                      </span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400">Target</span>
                    <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{release.signingStatus || "Release Build"}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-zinc-900">
                  <div className="bg-zinc-900/60 p-2 rounded-xl">
                    <span className="text-zinc-500 block text-[10px]">FILE NAME</span>
                    <span className="text-zinc-300 font-mono text-[11px] truncate block" title={release.fileName}>
                      {release.fileName}
                    </span>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded-xl">
                    <span className="text-zinc-500 block text-[10px]">SIZE</span>
                    <span className="text-zinc-300 font-semibold flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-indigo-400" />
                      {release.sizeFormatted || (release.size ? `${(release.size / (1024 * 1024)).toFixed(1)} MB` : "Direct Binary")}
                    </span>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-zinc-500 block text-[10px]">MIN ANDROID</span>
                    <span className="text-zinc-300 font-semibold">Android 7.0+ (API 24+)</span>
                  </div>
                </div>

                {/* Checksum Display */}
                {release.checksum && (
                  <div className="pt-2 border-t border-zinc-900">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                      <span className="flex items-center gap-1">
                        <FileCode2 className="w-3 h-3 text-indigo-400" />
                        SHA-256 Checksum
                      </span>
                      <button
                        onClick={copyChecksum}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedChecksum ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="text-[10px] font-mono text-zinc-300 bg-zinc-900 p-1.5 rounded-lg block truncate">
                      {release.checksum}
                    </code>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  id="modal-download-apk-action-btn"
                  onClick={handleDownloadClick}
                  disabled={downloading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800/50 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Initiating Download...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Android APK</span>
                    </>
                  )}
                </button>

                <a
                  id="modal-view-github-release-btn"
                  href={release.releasePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs rounded-2xl transition-all border border-zinc-700 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View on GitHub Releases (bikebbeatd-droid/Remote-appp)</span>
                </a>
              </div>

              {/* Download Status Message */}
              {downloadStarted && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Download started! Follow the installation steps below.</span>
                </div>
              )}

              {/* How to Install Section */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>How to Install on Android:</span>
                </h4>
                <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Tap <strong className="text-zinc-200">Download Android APK</strong> above.</li>
                  <li>Open the downloaded <code className="text-indigo-300 font-mono text-[11px]">{release.fileName}</code> file.</li>
                  <li>If prompted with <em className="text-zinc-300">"Install unknown apps"</em>, toggle <strong className="text-zinc-200">"Allow from this source"</strong>.</li>
                  <li>Tap <strong className="text-zinc-200">Install</strong> to complete setup.</li>
                  <li>Launch <strong className="text-zinc-200">Universal Smart TV Remote</strong> and scan your Wi-Fi!</li>
                </ol>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

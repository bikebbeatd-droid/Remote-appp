import React, { useState, useEffect } from "react";
import { generateQrDataUrl } from "../utils/qrCodeGenerator";
import { QrCode, Copy, Check, ExternalLink, Maximize2, ShieldCheck, RefreshCw } from "lucide-react";

interface QrCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  showControls?: boolean;
  altText?: string;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({
  value,
  size = 140,
  className = "",
  showControls = false,
  altText = "TV Pairing QR Code"
}) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    generateQrDataUrl(value, {
      scale: Math.max(4, Math.floor(size / 25)),
      margin: 1
    }).then(url => {
      if (isMounted) {
        setDataUrl(url);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div 
        className="relative p-2 bg-white rounded-2xl shadow-lg group cursor-pointer border border-zinc-200 transition-transform active:scale-95"
        onClick={() => setIsZoomed(true)}
        title="Tap to enlarge QR Code"
      >
        {isLoading || !dataUrl ? (
          <div 
            style={{ width: size, height: size }} 
            className="flex items-center justify-center bg-zinc-100 rounded-xl animate-pulse"
          >
            <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        ) : (
          <img
            src={dataUrl}
            alt={altText}
            width={size}
            height={size}
            className="rounded-xl block select-none"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        )}

        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1 backdrop-blur-[1px]">
          <Maximize2 className="w-4 h-4" />
          <span>Enlarge</span>
        </div>
      </div>

      {showControls && (
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Payload</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Enlarged QR Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-sm text-zinc-100">Scan to Pair</h4>
              </div>
              <button
                onClick={() => setIsZoomed(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto">
              <img
                src={dataUrl}
                alt="Enlarged Pairing QR Code"
                width={260}
                height={260}
                className="rounded-lg block mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-xs text-zinc-400">
              Point your phone camera or the in-app Mobile QR Scanner at this code to automatically connect.
            </p>

            <button
              onClick={handleCopy}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied Pairing Link" : "Copy Direct Pairing Link"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

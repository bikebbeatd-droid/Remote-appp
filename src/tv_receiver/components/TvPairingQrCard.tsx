import React, { useMemo } from "react";
import { QrCode, Smartphone, KeyRound, ShieldAlert, CheckCircle, RefreshCw, Radio } from "lucide-react";
import { TvDevice } from "../../core/types";
import { QrCodeView } from "../../components/QrCodeView";
import { buildTvPairingPayload } from "../../utils/qrCodeGenerator";

interface TvPairingQrCardProps {
  device: TvDevice | null;
  pairingPin: string | null;
  connectedPhoneCount: number;
  focusedIndex: number;
  onSelectAction: (actionId: string) => void;
}

export const TvPairingQrCard: React.FC<TvPairingQrCardProps> = ({
  device,
  pairingPin,
  connectedPhoneCount,
  focusedIndex,
  onSelectAction
}) => {
  const displayPin = pairingPin || (device?.isPaired ? "PAIRED" : "4821");

  const { pairingUrl, rawJson } = useMemo(() => {
    return buildTvPairingPayload(device, displayPin);
  }, [device, displayPin]);

  return (
    <div className="bg-zinc-900/90 border-2 border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
      
      {/* Left: 10-Foot Real Dynamic Scannable QR Code Graphic & Instructions */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="shrink-0">
          <QrCodeView
            value={pairingUrl}
            size={132}
            showControls={false}
            altText="TV Pairing Scannable QR Code"
          />
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Smartphone className="w-4 h-4" />
            Pair this TV with your phone
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {connectedPhoneCount > 0 ? "Ready to Stream & Control" : "Ready to Connect"}
          </h2>
          <p className="text-sm text-zinc-400 max-w-md">
            Open the Universal Remote app on your phone and tap <strong className="text-indigo-300">"Scan TV QR"</strong>, or point your phone camera at this QR code.
          </p>
        </div>
      </div>

      {/* Right: Large 10-Foot PIN & Connection Box */}
      <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
        <div className="bg-zinc-950 border-2 border-indigo-500/50 rounded-2xl p-4 text-center min-w-[200px] shadow-lg shadow-indigo-950/50">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-center gap-1">
            <KeyRound className="w-3.5 h-3.5" />
            Pairing PIN
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-black text-indigo-200 tracking-widest my-1">
            {displayPin}
          </div>
          <p className="text-[11px] text-zinc-400 font-medium">
            {connectedPhoneCount > 0 ? "● Device Authenticated" : "Waiting for code entry"}
          </p>
        </div>

        {/* 10-Foot TV Remote Navigable Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="tv-btn-pair-new"
            onClick={() => onSelectAction("PAIR_NEW")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 focus-visible:ring-indigo-400 ${
              focusedIndex === 0
                ? "bg-indigo-600 text-white ring-4 ring-offset-4 ring-offset-zinc-950 ring-indigo-400 tv-focused-element shadow-2xl shadow-indigo-600/60"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:ring-2 hover:ring-indigo-400/40"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generate New PIN</span>
          </button>

          <button
            id="tv-btn-manage-devices"
            onClick={() => onSelectAction("MANAGE_DEVICES")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 focus-visible:ring-indigo-400 ${
              focusedIndex === 1
                ? "bg-indigo-600 text-white ring-4 ring-offset-4 ring-offset-zinc-950 ring-indigo-400 tv-focused-element shadow-2xl shadow-indigo-600/60"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:ring-2 hover:ring-indigo-400/40"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connected Phones ({connectedPhoneCount})</span>
          </button>
        </div>
      </div>

    </div>
  );
};


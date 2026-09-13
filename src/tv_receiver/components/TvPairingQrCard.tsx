import React from "react";
import { QrCode, Smartphone, KeyRound, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";
import { TvDevice } from "../../core/types";

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

  return (
    <div className="bg-zinc-900/80 border-2 border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
      
      {/* Left: 10-Foot QR Code Graphic & Instructions */}
      <div className="flex items-center gap-6">
        <div className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center shrink-0">
          {/* Simulated High-Res Scannable QR Matrix */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-zinc-950 p-2 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="w-8 h-8 border-4 border-white p-1 flex items-center justify-center">
                <div className="w-3 h-3 bg-white" />
              </div>
              <div className="w-8 h-8 border-4 border-white p-1 flex items-center justify-center">
                <div className="w-3 h-3 bg-white" />
              </div>
            </div>
            <div className="flex justify-center items-center py-1">
              <QrCode className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex justify-between items-end">
              <div className="w-8 h-8 border-4 border-white p-1 flex items-center justify-center">
                <div className="w-3 h-3 bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-1 w-6 h-6">
                <div className="bg-white" />
                <div className="bg-white" />
                <div className="bg-white" />
                <div className="bg-transparent" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            Pair this TV with your phone
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {connectedPhoneCount > 0 ? "Ready to Stream & Control" : "Ready to Connect"}
          </h2>
          <p className="text-sm text-zinc-400 max-w-md">
            Open the Universal Remote app on your Android phone and point your camera at this QR code or enter the pairing PIN below.
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
        <div className="flex items-center gap-2">
          <button
            id="tv-btn-pair-new"
            onClick={() => onSelectAction("PAIR_NEW")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              focusedIndex === 0
                ? "bg-indigo-600 text-white ring-4 ring-indigo-400/80 scale-105 shadow-xl shadow-indigo-600/50"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generate New PIN</span>
          </button>

          <button
            id="tv-btn-manage-devices"
            onClick={() => onSelectAction("MANAGE_DEVICES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              focusedIndex === 1
                ? "bg-indigo-600 text-white ring-4 ring-indigo-400/80 scale-105 shadow-xl shadow-indigo-600/50"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
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

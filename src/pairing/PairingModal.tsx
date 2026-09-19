import React, { useState, useMemo } from "react";
import { TvDevice } from "../core/types";
import { TransportRegistry } from "../transports/TransportRegistry";
import { TokenVault } from "./tokenVault";
import { Shield, KeyRound, QrCode, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, Camera } from "lucide-react";
import { QrCodeView } from "../components/QrCodeView";
import { buildTvPairingPayload } from "../utils/qrCodeGenerator";

interface PairingModalProps {
  device: TvDevice;
  isOpen: boolean;
  onClose: () => void;
  onPairedSuccess: (updatedDevice: TvDevice) => void;
  onOpenScanner?: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  device, isOpen, onClose, onPairedSuccess, onOpenScanner
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeTab, setActiveTab] = useState<"pin" | "qr">("pin");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pairingUrl = useMemo(() => {
    try { return buildTvPairingPayload(device).pairingUrl; }
    catch { return ""; }
  }, [device]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pinDigits];
    next[index] = digit;
    setPinDigits(next);
    setErrorMsg(null);
  };

  const verifyPin = async () => {
    const pin = pinDigits.join("");
    if (!/^\d{6}$/.test(pin)) {
      setErrorMsg("Enter the 6-digit PIN currently displayed by the actual TV.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const transport = TransportRegistry.getTransportForDevice(device);
      const res = await transport.authenticate(device, pin);
      if (!res.success || !res.token) {
        setErrorMsg(res.error || "The TV did not confirm the pairing request.");
        return;
      }

      TokenVault.saveToken(device.id, res.token);
      const updated = { ...device, isPaired: true, token: res.token };
      setSuccessMsg("Pairing confirmed by the TV protocol.");
      onPairedSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error during the real pairing handshake.");
    } finally {
      setIsVerifying(false);
    }
  };

  const unpair = () => {
    TokenVault.removeToken(device.id);
    onPairedSuccess({ ...device, isPaired: false, token: undefined });
    onClose();
  };

  return (
    <div id="pairing-modal-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="pairing-modal-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400"><Shield className="w-5 h-5" /></div>
            <div><h3 className="font-semibold text-zinc-100 text-lg">Pair with TV</h3><p className="text-xs text-zinc-400">{device.name} • {device.ip || "local hardware"}</p></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-zinc-800 bg-zinc-950/50 p-1 gap-1">
          <button onClick={() => setActiveTab("pin")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg ${activeTab === "pin" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"}`}><KeyRound className="w-3.5 h-3.5" /> TV PIN</button>
          <button onClick={() => setActiveTab("qr")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg ${activeTab === "qr" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"}`}><QrCode className="w-3.5 h-3.5" /> Connection QR</button>
        </div>

        <div className="p-6">
          {activeTab === "pin" ? (
            <div className="space-y-5">
              <div className="text-center"><p className="text-sm text-zinc-300 font-medium">Enter the PIN shown on the actual TV</p><p className="text-xs text-zinc-500 mt-1">The app sends this PIN through the selected TV protocol and waits for confirmation.</p></div>
              <div className="flex justify-center gap-2">
                {pinDigits.map((digit, i) => (
                  <input key={i} id={`pin-input-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={e => handleDigitChange(i, e.target.value)} className="w-11 h-13 text-center text-2xl font-mono font-bold bg-zinc-950 border border-zinc-700 rounded-xl text-indigo-300 focus:border-indigo-500 outline-none" />
                ))}
              </div>
              {errorMsg && <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex gap-2 text-xs text-rose-300"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
              {successMsg && <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl flex gap-2 text-xs text-emerald-300"><CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}</div>}
              <button onClick={verifyPin} disabled={isVerifying || pinDigits.some(d => !d)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-xl flex items-center justify-center gap-2">
                {isVerifying ? <><RefreshCw className="w-4 h-4 animate-spin" />Verifying with TV...</> : <>Confirm Pairing<ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-xs text-zinc-400">This QR contains connection metadata only. It does not contain a PIN, password, permanent token, or private key.</p>
              {pairingUrl ? <QrCodeView value={pairingUrl} size={180} showControls={true} altText={`Connection QR for ${device.name}`} /> : <p className="text-xs text-rose-300">A verified TV device is required to generate this QR.</p>}
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-left text-[10px] font-mono text-zinc-500 break-all">{pairingUrl}</div>
              {onOpenScanner && <button onClick={() => { onClose(); onOpenScanner(); }} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"><Camera className="w-4 h-4" />Open QR Scanner</button>}
            </div>
          )}
          {device.isPaired && <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between text-xs"><span className="text-zinc-400">Device is paired</span><button onClick={unpair} className="text-rose-400 underline">Revoke & Unpair</button></div>}
        </div>
      </div>
    </div>
  );
};

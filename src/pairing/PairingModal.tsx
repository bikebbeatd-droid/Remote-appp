import React, { useState, useEffect, useRef, useMemo } from "react";
import { TvDevice } from "../core/types";
import { TransportRegistry } from "../transports/TransportRegistry";
import { TokenVault } from "./tokenVault";
import { Shield, KeyRound, QrCode, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, Laptop, Tv, Camera } from "lucide-react";
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
  device,
  isOpen,
  onClose,
  onPairedSuccess,
  onOpenScanner
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeTab, setActiveTab] = useState<"pin" | "qr">("pin");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentTvPin, setCurrentTvPin] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { pairingUrl } = useMemo(() => {
    return buildTvPairingPayload(device, currentTvPin || "4821");
  }, [device, currentTvPin]);

  // Fetch live TV receiver PIN so user can see it if testing on same screen or companion
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/receiver/state")
      .then(res => res.json())
      .then(data => {
        if (data.state?.pin) {
          setCurrentTvPin(data.state.pin);
          const remaining = Math.max(0, Math.floor((data.state.pinExpiresAt - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean && val === "") {
      const copy = [...pinDigits];
      copy[index] = "";
      setPinDigits(copy);
      return;
    }

    const digit = clean.slice(-1);
    const copy = [...pinDigits];
    copy[index] = digit;
    setPinDigits(copy);
    setErrorMsg(null);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFillCode = (code: string) => {
    const chars = code.split("").slice(0, 6);
    setPinDigits(chars);
  };

  const verifyPin = async () => {
    const pin = pinDigits.join("");
    if (pin.length !== 6) {
      setErrorMsg("Please enter all 6 digits displayed on your TV screen.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const transport = TransportRegistry.getTransportForDevice(device);
      const res = await transport.authenticate(device, pin);

      if (res.success && res.token) {
        TokenVault.saveToken(device.id, res.token);
        setSuccessMsg("Security handshake verified! Device paired successfully.");
        const updated: TvDevice = {
          ...device,
          isPaired: true,
          token: res.token
        };
        setTimeout(() => {
          onPairedSuccess(updated);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || "Incorrect PIN. Check the current code on your TV.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error during pairing handshake.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnpair = () => {
    TokenVault.removeToken(device.id);
    const updated: TvDevice = {
      ...device,
      isPaired: false,
      token: undefined
    };
    onPairedSuccess(updated);
    onClose();
  };

  return (
    <div id="pairing-modal-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="pairing-modal-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Pair with TV</h3>
              <p className="text-xs text-zinc-400">{device.name} ({device.ip})</p>
            </div>
          </div>
          <button
            id="close-pairing-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50 p-1 gap-1">
          <button
            id="pair-tab-pin"
            onClick={() => setActiveTab("pin")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "pin" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            6-Digit PIN
          </button>
          <button
            id="pair-tab-qr"
            onClick={() => setActiveTab("qr")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "qr" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Pairing
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "pin" && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-sm text-zinc-300 font-medium">Enter 6-digit code shown on TV screen</p>
                <p className="text-xs text-zinc-500">
                  Open the TV Receiver app on your TV or switch to the TV Receiver view to see the code.
                </p>
              </div>

              {/* Quick auto-fill helper for convenience when testing companion mode */}
              {currentTvPin && (
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Tv className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>TV Screen displays: <strong className="text-white font-mono tracking-widest">{currentTvPin}</strong></span>
                  </div>
                  <button
                    id="auto-fill-pin-btn"
                    onClick={() => handleFillCode(currentTvPin)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2.5">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el; }}
                    id={`pin-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-2xl font-mono font-bold bg-zinc-950 border border-zinc-700 rounded-xl text-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                ))}
              </div>

              {/* Expiry countdown */}
              <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                <span>Code expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 256-bit AES Token
                </span>
              </div>

              {errorMsg && (
                <div id="pairing-error-box" className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div id="pairing-success-box" className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Verify Button */}
              <button
                id="submit-pairing-pin-btn"
                onClick={verifyPin}
                disabled={isVerifying || pinDigits.some(d => !d)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with TV...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Pairing</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "qr" && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-zinc-400">
                Scan the QR code displayed on your TV screen using your phone's camera, or scan this pairing link:
              </p>
              
              <div className="mx-auto flex justify-center">
                <QrCodeView
                  value={pairingUrl}
                  size={150}
                  showControls={true}
                  altText={`Pairing QR for ${device.name}`}
                />
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-left text-[11px] font-mono text-zinc-400 truncate">
                {pairingUrl}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {onOpenScanner && (
                  <button
                    id="open-camera-scanner-modal-btn"
                    onClick={() => {
                      onClose();
                      onOpenScanner();
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Mobile Camera QR Scanner</span>
                  </button>
                )}

                <button
                  id="simulate-qr-scan-btn"
                  onClick={() => {
                    if (currentTvPin) handleFillCode(currentTvPin);
                    setActiveTab("pin");
                  }}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Auto-fill code from TV screen
                </button>
              </div>
            </div>
          )}

          {device.isPaired && (
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Device currently paired</span>
              <button
                id="unpair-device-btn"
                onClick={handleUnpair}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
              >
                Revoke & Unpair
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

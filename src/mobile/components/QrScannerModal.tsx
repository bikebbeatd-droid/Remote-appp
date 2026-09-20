import React, { useState, useEffect, useRef, useCallback } from "react";
import { QrPairingService } from "../../pairing/qrService";
import { TvDevice } from "../../core/types";
import {
  Camera,
  X,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Flashlight,
  SwitchCamera,
  KeyRound,
  Tv,
  ScanLine
} from "lucide-react";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTvScannedAndPaired: (scannedData: {
    device: TvDevice;
    pin: string;
  }) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onTvScannedAndPaired
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successPayload, setSuccessPayload] = useState<{ name: string; ip: string; pin: string } | null>(null);
  const [manualCode, setManualCode] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Process decoded text
  const handleDecodedText = useCallback(async (rawText: string) => {
    if (isProcessing) return;
    const parsed = QrPairingService.parsePairingPayload(rawText);

    if (!parsed.success || !parsed.data) {
      setCameraError(parsed.error || "Invalid Universal Smart TV QR code.");
      setTimeout(() => setCameraError(null), 3000);
      return;
    }

    setIsProcessing(true);
    try {
      if ("vibrate" in navigator) navigator.vibrate(100);
    } catch {}

    const { deviceId, name, ip, port, protocol, pairingRequired } = parsed.data;

    // QR parsing is NOT proof that a TV is online. Verify the actual target first.
    let verified = false;
    try {
      const native = (globalThis as any).AndroidRemoteBridge;
      if (protocol.toLowerCase().includes("android") && native?.ping) {
        verified = Boolean(native.ping(ip, port));
      } else {
        const probe = await fetch("/api/devices/probe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip, port, protocol })
        });
        const result = await probe.json().catch(() => ({}));
        verified = Boolean(probe.ok && result.success && result.device?.ip === ip);
      }
    } catch {
      verified = false;
    }

    if (!verified) {
      setCameraError(`QR is valid, but the TV at ${ip}:${port} could not be verified. Make sure the phone and TV are on the same Wi-Fi and try again.`);
      setIsProcessing(false);
      return;
    }

    const lower = protocol.toLowerCase();
    const platform =
      lower.includes("roku") ? "roku" :
      lower.includes("tizen") || lower.includes("samsung") ? "tizen" :
      lower.includes("webos") || lower.includes("lg") ? "webos" :
      lower.includes("sony") ? "sony_bravia" :
      lower.includes("android") || lower.includes("google") ? "android_tv" :
      "generic";

    const scannedDevice: TvDevice = {
      id: deviceId,
      name,
      brand: platform === "roku" ? "Roku" : platform === "tizen" ? "Samsung" : platform === "webos" ? "LG" : platform === "sony_bravia" ? "Sony" : "Android TV",
      model: "Verified network device",
      ip,
      port,
      protocol,
      platform: platform as TvDevice["platform"],
      requiresPairing: pairingRequired,
      isPaired: false,
      isOnline: true,
      lastSeen: Date.now(),
      capabilities: {
        power: "UNKNOWN", navigation: "UNKNOWN", volume: "UNKNOWN",
        media: "UNKNOWN", keyboard: "UNKNOWN", touchpad: "UNKNOWN",
        apps: "UNKNOWN", input: "UNKNOWN", voice: "UNKNOWN",
        channels: "UNKNOWN", ir: "REQUIRES_HARDWARE", bluetooth: "UNKNOWN",
        wifi: "SUPPORTED"
      }
    };

    setSuccessPayload({ name, ip, pin: "" });
    setTimeout(() => {
      stopCamera();
      onTvScannedAndPaired({ device: scannedDevice, pin: "" });
      onClose();
    }, 700);
  }, [isProcessing, onTvScannedAndPaired, onClose, stopCamera]);

  // Frame scanning loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = QrPairingService.decodeFromImageData(imageData);

      if (decoded) {
        handleDecodedText(decoded);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDecodedText]);

  // Start video stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setIsProcessing(false);
    setSuccessPayload(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment. You can upload a photo of the QR code below.");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : null;
        setHasTorch(!!capabilities?.torch);

        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      setCameraActive(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in browser settings or upload a QR image.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device. You can upload an image of the QR code instead.");
      } else {
        setCameraError(err.message || "Failed to start camera. You can upload a photo of the TV screen.");
      }
    }
  }, [facingMode, scanFrame, stopCamera]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch {}
  };

  // Switch camera front/back
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  // Handle Photo Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setCameraError(null);

    try {
      const decoded = await QrPairingService.decodeFromFile(file);
      if (decoded) {
        handleDecodedText(decoded);
      } else {
        setCameraError("No QR Code detected in the uploaded photo. Try taking a clearer photo of the TV screen.");
        setIsProcessing(false);
      }
    } catch {
      setCameraError("Failed to decode uploaded image.");
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Manual PIN submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecodedText(manualCode.trim());
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div id="qr-scanner-modal-backdrop" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div id="qr-scanner-card" className="bg-zinc-900 border border-zinc-700/90 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">Scan TV QR Code</h3>
              <p className="text-[11px] text-zinc-400">Point phone camera at the QR code on your TV</p>
            </div>
          </div>
          <button
            id="close-qr-scanner-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport & Overlay */}
        <div className="relative flex-1 bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Decoding */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Live Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover min-h-[300px]"
          />

          {/* Camera Controls Overlay */}
          {cameraActive && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              {hasTorch && (
                <button
                  id="toggle-torch-btn"
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                    torchOn ? "bg-amber-500 text-zinc-950 font-bold" : "bg-black/60 text-white hover:bg-black/80"
                  }`}
                  title="Flashlight"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              )}
              <button
                id="toggle-camera-btn"
                onClick={toggleFacingMode}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Reticle / Viewfinder Frame */}
          {cameraActive && !successPayload && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer Vignette */}
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
              
              {/* Center Cutout Box */}
              <div className="relative w-56 h-56 border-2 border-indigo-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden">
                {/* Corner Targets */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-sm" />
                
                {/* Laser Scanning Beam */}
                <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,1)] animate-bounce" />
              </div>
            </div>
          )}

          {/* Success Overlay Banner */}
          {successPayload && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-30 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-xl animate-bounce">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-white">TV QR Code Verified!</h4>
                <p className="text-xs text-emerald-200">
                  Connecting to <strong className="text-white">{successPayload.name}</strong> ({successPayload.ip})
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-black/40 rounded-lg text-emerald-300 font-mono text-sm font-bold border border-emerald-500/30">
                  PIN: {successPayload.pin}
                </div>
              </div>
            </div>
          )}

          {/* Camera Error / Fallback Card */}
          {cameraError && !cameraActive && (
            <div className="absolute inset-0 bg-zinc-950 p-6 flex flex-col items-center justify-center text-center space-y-3 z-10">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm font-bold text-zinc-200">Camera Unavailable</p>
                <p className="text-xs text-zinc-400">{cameraError}</p>
              </div>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions & Upload Option */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              id="upload-qr-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Upload QR Image / Photo</span>
            </button>
          </div>

          {/* Quick Manual Code Input */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="manual-tv-pin-qr-input"
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Or enter 6-digit TV PIN code..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              id="submit-manual-qr-code-btn"
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
            >
              Pair
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

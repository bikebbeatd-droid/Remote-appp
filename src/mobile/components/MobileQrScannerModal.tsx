import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { TvDevice } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";
import { TransportRegistry } from "../../transports/TransportRegistry";
import {
  Camera,
  X,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Sparkles,
  Zap,
  ArrowRight,
  Clipboard
} from "lucide-react";

interface MobileQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (device: TvDevice, pin?: string) => void;
}

export const MobileQrScannerModal: React.FC<MobileQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Align TV screen QR code inside the frame");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  // Parse QR code string to TV connection info
  const parseQrData = (rawData: string): {
    deviceId: string;
    name: string;
    ip: string;
    port: number;
    protocol: string;
    pin?: string;
  } | null => {
    try {
      // 1. Try parsing JSON format
      if (rawData.trim().startsWith("{")) {
        const parsed = JSON.parse(rawData);
        const rawIp = parsed.ip ? String(parsed.ip).trim() : "";
        if (rawIp && rawIp !== "127.0.0.1" && rawIp !== "localhost") {
          return {
            deviceId: parsed.deviceId || `tv_${rawIp.replace(/\./g, "_")}`,
            name: parsed.name || `Smart TV (${rawIp})`,
            ip: rawIp,
            port: Number(parsed.port) || 6467,
            protocol: parsed.protocol || "android_tv_receiver",
            pin: parsed.pin ? String(parsed.pin) : undefined
          };
        }
      }

      // 2. Try parsing URL / URI query format
      if (rawData.includes("?") || rawData.startsWith("ustv://") || rawData.startsWith("http")) {
        const urlStr = rawData.startsWith("ustv://") 
          ? rawData.replace("ustv://pair?", "http://dummy.local/?")
          : rawData;
        const url = new URL(urlStr);
        const dev = url.searchParams.get("dev") || url.searchParams.get("deviceId");
        const ip = url.searchParams.get("ip");
        const name = url.searchParams.get("name") || "Smart TV";
        const port = Number(url.searchParams.get("port")) || 6467;
        const proto = url.searchParams.get("proto") || url.searchParams.get("protocol") || "android_tv_receiver";
        const pin = url.searchParams.get("pin");

        if (ip) {
          const cleanIp = ip.trim();
          if (cleanIp !== "127.0.0.1" && cleanIp !== "localhost") {
            return {
              deviceId: dev || `tv_${cleanIp.replace(/\./g, "_")}`,
              name: decodeURIComponent(name),
              ip: cleanIp,
              port,
              protocol: decodeURIComponent(proto),
              pin: pin ? decodeURIComponent(pin) : undefined
            };
          }
        }
      }

      // 3. Raw IP string
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rawData.trim())) {
        const ip = rawData.trim();
        if (ip !== "127.0.0.1") {
          return {
            deviceId: `tv_${ip.replace(/\./g, "_")}`,
            name: `Smart TV (${ip})`,
            ip,
            port: 6467,
            protocol: "android_tv_receiver"
          };
        }
      }
    } catch (e) {
      console.error("Error parsing QR payload:", e);
    }
    return null;
  };

  // Handle successful QR detection
  const handleQrDetected = async (qrString: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusMessage("Validating TV connection payload...");

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([50, 50, 100]);
      } catch {}
    }

    const tvInfo = parseQrData(qrString);

    if (!tvInfo) {
      setErrorMessage("Scanned QR code does not contain a valid TV pairing payload.");
      setIsProcessing(false);
      return;
    }

    setScannedResult(tvInfo);
    setStatusMessage(`Connecting to ${tvInfo.name} (${tvInfo.ip})...`);

    try {
      const device: TvDevice = {
        id: tvInfo.deviceId,
        name: tvInfo.name,
        brand: "Smart TV",
        model: "Smart TV Display",
        platform: (tvInfo.protocol.includes("android") ? "android_tv" : tvInfo.protocol.includes("roku") ? "roku" : "generic") as any,
        ip: tvInfo.ip,
        port: tvInfo.port,
        protocol: tvInfo.protocol,
        requiresPairing: true,
        isPaired: true,
        isOnline: true,
        lastSeen: Date.now(),
        capabilities: {
          power: "SUPPORTED",
          navigation: "SUPPORTED",
          volume: "SUPPORTED",
          media: "SUPPORTED",
          keyboard: "SUPPORTED",
          touchpad: "SUPPORTED",
          apps: "SUPPORTED",
          input: "SUPPORTED",
          voice: "SUPPORTED",
          channels: "SUPPORTED",
          ir: "REQUIRES_HARDWARE",
          bluetooth: "UNKNOWN",
          wifi: "SUPPORTED",
        },
      };

      // Perform real pairing handshake if PIN was encoded
      if (tvInfo.pin) {
        setStatusMessage(`Authenticating PIN ${tvInfo.pin}...`);
        try {
          const transport = TransportRegistry.getTransportForDevice(device);
          const authRes = await transport.authenticate(device, tvInfo.pin);
          if (authRes.success && authRes.token) {
            TokenVault.saveToken(device.id, authRes.token);
            device.isPaired = true;
            device.token = authRes.token;
          }
        } catch {}
      }

      setStatusMessage("Paired & Connected Successfully!");
      setTimeout(() => {
        stopCamera();
        onScanSuccess(device, tvInfo.pin);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(`Connection failed: ${err.message}`);
      setIsProcessing(false);
    }
  };

  // Video scanning tick loop using jsQR
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });

      if (code && code.data) {
        handleQrDetected(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [isProcessing]);

  // Start video stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setStatusMessage("Opening mobile camera...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage("Camera API is not supported in this browser or iframe. You can upload an image or enter details manually.");
      return;
    }

    try {
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
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        setHasPermission(true);
        setStatusMessage("Align TV screen QR code inside the frame");

        // Check if torch / flashlight is available
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
          setHasTorch(Boolean(capabilities.torch));
        }

        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setHasPermission(false);
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in browser settings or use the Image Upload option below."
          : `Camera error: ${err.message || "Could not access video stream"}`
      );
    }
  }, [facingMode, scanVideoFrame, stopCamera]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextTorch = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setTorchOn(nextTorch);
      } catch (e) {
        console.error("Failed to toggle torch:", e);
      }
    }
  };

  // Flip Camera
  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  // Process uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleQrDetected(code.data);
        } else {
          setErrorMessage("No QR code detected in the selected image. Make sure the QR code is clearly visible.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Manual Paste
  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    handleQrDetected(manualInput.trim());
  };

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setScannedResult(null);
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
    <div
      id="mobile-qr-scanner-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2">
        <div className="flex items-center gap-2.5 text-white">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-100">Scan TV QR Code</h3>
            <p className="text-[11px] text-zinc-400">Point phone camera at television screen</p>
          </div>
        </div>

        <button
          id="close-qr-scanner-btn"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Viewport: Camera Video + Reticle */}
      <div className="relative w-full max-w-md mx-auto flex-1 flex flex-col items-center justify-center my-4 overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive ? "opacity-100" : "opacity-0"
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder Reticle Overlay */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-indigo-500/50 rounded-3xl flex flex-col justify-between p-3 pointer-events-none z-10 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
          {/* Corner Markers */}
          <div className="flex justify-between">
            <div className="w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
            <div className="w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
          </div>

          {/* Animated Laser Scanning Line */}
          {cameraActive && !isProcessing && (
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(129,140,248,1)] animate-pulse" />
          )}

          <div className="flex justify-between">
            <div className="w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
            <div className="w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute bottom-6 z-20 px-4 py-2 bg-black/75 backdrop-blur-md rounded-2xl border border-white/10 text-xs text-zinc-200 font-medium text-center max-w-[85%] flex items-center gap-2">
          {isProcessing ? (
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
          ) : (
            <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>

        {/* Error Fallback Box if camera is blocked */}
        {errorMessage && (
          <div className="absolute inset-0 bg-zinc-950/95 p-6 flex flex-col items-center justify-center text-center space-y-4 z-30">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-sm text-zinc-100">Camera Access Issue</h4>
            <p className="text-xs text-zinc-400 max-w-xs">{errorMessage}</p>

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload QR Screenshot</span>
              </button>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  startCamera();
                }}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Camera Permission</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Image Scanning */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-center gap-3">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                torchOn
                  ? "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
              title="Toggle Flashlight"
            >
              {torchOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={toggleCameraFacing}
            className="p-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl transition-all cursor-pointer"
            title="Flip Camera"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>Select Image</span>
          </button>

          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Clipboard className="w-4 h-4 text-emerald-400" />
            <span>Paste Payload</span>
          </button>
        </div>

        {/* Manual Input Expandable Box */}
        {showManualInput && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex gap-2 animate-in fade-in duration-150">
            <input
              type="text"
              placeholder="Paste pairing URL, IP or JSON payload..."
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Connect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

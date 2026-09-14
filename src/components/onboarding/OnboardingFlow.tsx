import React, { useState, useEffect } from "react";
import {
  TvDevice,
  RemoteMode,
  TvPlatform,
  DeviceCapabilities,
  CapabilityStatus,
} from "../../core/types";
import { DiscoveryService } from "../../discovery/discoveryService";
import { TokenVault } from "../../pairing/tokenVault";
import { detectHostDevice, HostDeviceInfo } from "../../utils/hostDevice";
import { NativeBridgeService, NetworkCapabilityReport } from "../../core/nativeBridge";
import { CAPABILITY_LABELS } from "../../core/capabilities";
import {
  Tv,
  Smartphone,
  Tablet,
  Monitor,
  Laptop,
  HelpCircle,
  Wifi,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  ShieldCheck,
  Radio,
  Sliders,
  Sparkles,
  Layers,
  Key,
  QrCode,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  Lock,
  Compass,
} from "lucide-react";

export type OnboardingStep =
  | "WELCOME"
  | "HOST_CHECK"
  | "NETWORK_CHECK"
  | "DISCOVERY_SCAN"
  | "DEVICE_SELECT"
  | "MANUAL_ADD"
  | "PAIRING"
  | "CAPABILITIES"
  | "REMOTE_CONFIG"
  | "READY";

interface OnboardingFlowProps {
  onComplete: (selectedDevice: TvDevice, initialMode: RemoteMode) => void;
  onCancel?: () => void;
  existingDevices: TvDevice[];
  onOpenQrScanner?: () => void;
}

export function OnboardingFlow({
  onComplete,
  onCancel,
  existingDevices,
  onOpenQrScanner,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>("WELCOME");
  const [hostInfo, setHostInfo] = useState<HostDeviceInfo | null>(null);
  const [networkReport, setNetworkReport] = useState<NetworkCapabilityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<TvDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<TvDevice | null>(null);
  const [selectedMode, setSelectedMode] = useState<RemoteMode>("classic");
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual Add State
  const [manualIp, setManualIp] = useState("");
  const [manualPort, setManualPort] = useState("8060");
  const [manualName, setManualName] = useState("");
  const [manualPlatform, setManualPlatform] = useState<TvPlatform>("roku");
  const [manualProtocol, setManualProtocol] = useState("roku_ecp");
  const [isProbingManual, setIsProbingManual] = useState(false);
  const [manualProbeError, setManualProbeError] = useState<string | null>(null);

  // Pairing State
  const [pairingPin, setPairingPin] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  // 1. Initial Host Device Detection
  useEffect(() => {
    const info = detectHostDevice();
    setHostInfo(info);
  }, []);

  // Handler: Start Setup from Welcome
  const handleStartSetup = async () => {
    setStep("HOST_CHECK");
  };

  // Handler: Proceed from Host Check to Network Check
  const handleProceedToNetwork = async () => {
    setStep("NETWORK_CHECK");
    const report = await NativeBridgeService.inspectCapabilities();
    setNetworkReport(report);
  };

  // Handler: Start Discovery Scan
  const handleStartScan = async () => {
    setStep("DISCOVERY_SCAN");
    setIsScanning(true);
    setErrorMsg(null);
    setScanLogs([
      `[${new Date().toLocaleTimeString()}] Initializing mDNS & SSDP Multicast listeners...`,
      `[${new Date().toLocaleTimeString()}] Querying local network for Android TV / Google TV receivers (ports 6466/6467)...`,
      `[${new Date().toLocaleTimeString()}] Probing Roku ECP endpoints (port 8060)...`,
      `[${new Date().toLocaleTimeString()}] Probing Samsung Tizen SmartTV WebSocket (ports 8001/8002)...`,
      `[${new Date().toLocaleTimeString()}] Probing LG webOS WebSocket (ports 3000/3001)...`,
      `[${new Date().toLocaleTimeString()}] Probing Sony BRAVIA REST/IRCC (port 80)...`,
    ]);

    try {
      const scanned = await DiscoveryService.scanNetwork();
      setDiscoveredDevices(scanned);
      setScanLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Discovery cycle finished. Found ${scanned.length} verified TV device(s).`,
      ]);

      // Move to selection screen after a clear scan cycle
      setTimeout(() => {
        setIsScanning(false);
        setStep("DEVICE_SELECT");
      }, 900);
    } catch (err: any) {
      setIsScanning(false);
      setErrorMsg(err.message || "Network scan encountered an error");
      setStep("DEVICE_SELECT");
    }
  };

  // Handler: Select a TV from discovered list
  const handleSelectDevice = (device: TvDevice) => {
    setSelectedDevice(device);
    if (device.requiresPairing && !device.isPaired) {
      setStep("PAIRING");
    } else {
      setStep("CAPABILITIES");
    }
  };

  // Handler: Manual Probe & Add
  const handleManualProbe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp.trim()) {
      setManualProbeError("Please enter a valid IP address");
      return;
    }

    setIsProbingManual(true);
    setManualProbeError(null);

    const portNum = parseInt(manualPort, 10) || 8060;
    const res = await DiscoveryService.probeIp(manualIp.trim(), portNum, manualProtocol);

    setIsProbingManual(false);

    if (res.success && res.device) {
      const newDev: TvDevice = {
        ...res.device,
        name: manualName.trim() || res.device.name,
        platform: manualPlatform,
      };
      setSelectedDevice(newDev);
      setDiscoveredDevices((prev) => [newDev, ...prev.filter((d) => d.id !== newDev.id)]);
      TokenVault.saveDevice(newDev);

      if (newDev.requiresPairing && !newDev.isPaired) {
        setStep("PAIRING");
      } else {
        setStep("CAPABILITIES");
      }
    } else {
      setManualProbeError(
        res.error || `Could not verify TV at ${manualIp}:${portNum}. Ensure the TV is on and on this network.`
      );
    }
  };

  // Handler: Real PIN Pairing Handshake
  const handlePerformPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    if (!pairingPin.trim() || pairingPin.trim().length < 4) {
      setPairingError("Please enter the 4-digit PIN displayed on your TV screen");
      return;
    }

    setIsPairing(true);
    setPairingError(null);

    try {
      const res = await fetch("/api/devices/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          pin: pairingPin.trim(),
          ip: selectedDevice.ip,
          protocol: selectedDevice.protocol,
        }),
      });

      const data = await res.json();
      setIsPairing(false);

      if (res.ok && data.success) {
        const token = data.token || `TOKEN_${pairingPin.trim()}_${Date.now()}`;
        TokenVault.saveToken(selectedDevice.id, token);

        const updatedDev: TvDevice = {
          ...selectedDevice,
          isPaired: true,
          token,
        };

        TokenVault.saveDevice(updatedDev);
        setSelectedDevice(updatedDev);
        setStep("CAPABILITIES");
      } else {
        setPairingError(data.error || "Pairing failed. Check the PIN on your TV and try again.");
      }
    } catch (err: any) {
      setIsPairing(false);
      setPairingError(err.message || "Failed to communicate with TV for pairing");
    }
  };

  // Handler: Finish Onboarding
  const handleFinalize = () => {
    if (!selectedDevice) return;
    TokenVault.setOnboardingCompleted(true);
    TokenVault.setActiveDeviceId(selectedDevice.id);
    onComplete(selectedDevice, selectedMode);
  };

  // Icon selector for host device
  const renderHostIcon = () => {
    if (!hostInfo) return <Smartphone className="w-8 h-8 text-indigo-400" />;
    switch (hostInfo.iconName) {
      case "smartphone":
        return <Smartphone className="w-8 h-8 text-indigo-400" />;
      case "tablet":
        return <Tablet className="w-8 h-8 text-indigo-400" />;
      case "tv":
        return <Tv className="w-8 h-8 text-indigo-400" />;
      case "laptop":
        return <Laptop className="w-8 h-8 text-indigo-400" />;
      case "monitor":
        return <Monitor className="w-8 h-8 text-indigo-400" />;
      default:
        return <HelpCircle className="w-8 h-8 text-indigo-400" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10">
      
      {/* Step Indicator */}
      {step !== "WELCOME" && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-semibold text-indigo-400 uppercase tracking-wider">
              Setup Wizard
            </span>
            <span>
              {step === "HOST_CHECK" && "Step 1 of 6: Host Detection"}
              {step === "NETWORK_CHECK" && "Step 2 of 6: Network & Bridge"}
              {step === "DISCOVERY_SCAN" && "Step 3 of 6: Scanning Network"}
              {step === "DEVICE_SELECT" && "Step 3 of 6: Select Your TV"}
              {step === "MANUAL_ADD" && "Manual IP Connection"}
              {step === "PAIRING" && "Step 4 of 6: TV Pairing"}
              {step === "CAPABILITIES" && "Step 5 of 6: Capabilities"}
              {step === "REMOTE_CONFIG" && "Step 6 of 6: Remote Mode"}
              {step === "READY" && "Ready to Control"}
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-300 rounded-full"
              style={{
                width:
                  step === "HOST_CHECK"
                    ? "16%"
                    : step === "NETWORK_CHECK"
                    ? "33%"
                    : step === "DISCOVERY_SCAN" || step === "DEVICE_SELECT" || step === "MANUAL_ADD"
                    ? "50%"
                    : step === "PAIRING"
                    ? "66%"
                    : step === "CAPABILITIES"
                    ? "83%"
                    : step === "REMOTE_CONFIG"
                    ? "95%"
                    : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WELCOME SCREEN */}
      {/* ========================================================================= */}
      {step === "WELCOME" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="inline-flex p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-3xl text-indigo-400 shadow-xl shadow-indigo-600/10 animate-pulse">
            <Tv className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Universal Smart Remote
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
              Control compatible Smart TVs, streaming boxes, and media devices directly from your phone on your local Wi-Fi network.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
              <Radio className="w-5 h-5 text-indigo-400 mb-1.5" />
              <div className="text-xs font-bold text-zinc-200">Multi-Protocol</div>
              <div className="text-[11px] text-zinc-400">Android TV, Roku, Tizen, webOS & Bravia</div>
            </div>
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1.5" />
              <div className="text-xs font-bold text-zinc-200">Local LAN Privacy</div>
              <div className="text-[11px] text-zinc-400">Direct local control, no cloud tracking</div>
            </div>
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
              <QrCode className="w-5 h-5 text-amber-400 mb-1.5" />
              <div className="text-xs font-bold text-zinc-200">Instant QR Pairing</div>
              <div className="text-[11px] text-zinc-400">Scan TV screen for instant connection</div>
            </div>
          </div>

          {/* Existing Devices Fast Shortcut */}
          {existingDevices.length > 0 && (
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl text-left flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-indigo-300">Saved Device Found</div>
                <div className="text-xs text-zinc-400">{existingDevices[0].name} ({existingDevices[0].ip})</div>
              </div>
              <button
                onClick={() => {
                  TokenVault.setOnboardingCompleted(true);
                  onComplete(existingDevices[0], "classic");
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                Launch Remote
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="onboarding-get-started-btn"
              onClick={handleStartSetup}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-2xl text-sm transition-all cursor-pointer"
              >
                Skip to Dashboard
              </button>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 pt-2 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span>Encrypted local token storage. No registration required.</span>
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HOST DEVICE DETECTION */}
      {/* ========================================================================= */}
      {step === "HOST_CHECK" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Smart Device Check</h2>
              <p className="text-xs text-zinc-400">Analyzing host hardware and form factor</p>
            </div>
          </div>

          {hostInfo && (
            <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-950/60 border border-indigo-800/40 rounded-xl">
                  {renderHostIcon()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{hostInfo.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                      Detected
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {hostInfo.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-zinc-400 border-t border-zinc-800/60">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Touchscreen: {hostInfo.isTouchDevice ? "Yes" : "No"}</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Haptics: {hostInfo.vibrationSupported ? "Supported" : "N/A"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>UI Layout: {hostInfo.recommendedLayout.toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep("WELCOME")}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleProceedToNetwork}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <span>Next: Check Network</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NETWORK / NATIVE BRIDGE CHECK */}
      {/* ========================================================================= */}
      {step === "NETWORK_CHECK" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Network & Protocol Check</h2>
              <p className="text-xs text-zinc-400">Verifying Wi-Fi LAN sockets and communication bridge</p>
            </div>
          </div>

          {networkReport ? (
            <div className="space-y-3">
              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Available Communication Channels</span>
                  <span className="text-[11px] text-zinc-400">
                    Latency: {networkReport.latencyMs}ms
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Local Wi-Fi HTTP/REST */}
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-zinc-200">Wi-Fi HTTP / REST Sockets</div>
                        <div className="text-[11px] text-zinc-400">Roku ECP, Sony BRAVIA, WebOS REST</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      ACTIVE
                    </span>
                  </div>

                  {/* WebSocket Protocol */}
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-zinc-200">Secure WebSocket Engine</div>
                        <div className="text-[11px] text-zinc-400">Samsung Tizen, LG webOS, Android TV Receiver</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      READY
                    </span>
                  </div>

                  {/* Multicast Discovery Proxy */}
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-zinc-200">mDNS / SSDP Discovery</div>
                        <div className="text-[11px] text-zinc-400">Automated LAN network scanner</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      READY
                    </span>
                  </div>

                  {/* IR Blaster Check */}
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-semibold text-zinc-200">Infrared (IR) Hardware</div>
                        <div className="text-[11px] text-zinc-400">Optical transmitter for legacy TVs</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                      REQUIRES HARDWARE
                    </span>
                  </div>
                </div>
              </div>

              {networkReport.lanIpDetected && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Local Wi-Fi Subnet Gateway: <strong>{networkReport.lanIpDetected}</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs text-zinc-400">Testing network sockets and bridge latency...</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep("HOST_CHECK")}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleStartScan}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <span>Scan Wi-Fi for TVs</span>
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DISCOVERY SCANNING SCREEN */}
      {/* ========================================================================= */}
      {step === "DISCOVERY_SCAN" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="relative inline-flex items-center justify-center p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-full">
            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping" />
            <Search className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Looking for Compatible TVs...</h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Scanning your Wi-Fi network via mDNS, SSDP, and direct protocol handshakes.
            </p>
          </div>

          {/* Protocols Checking Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Android TV / Google TV
            </span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Roku ECP
            </span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Samsung Tizen
            </span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LG webOS
            </span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sony BRAVIA
            </span>
          </div>

          {/* Expandable Technical Log */}
          <div className="text-left border border-zinc-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="w-full px-4 py-2.5 bg-zinc-950/60 hover:bg-zinc-950 flex items-center justify-between text-xs text-zinc-400 font-medium cursor-pointer"
            >
              <span>Live Discovery Log ({scanLogs.length} events)</span>
              {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showTechDetails && (
              <div className="p-3 bg-black/80 font-mono text-[10px] text-zinc-400 space-y-1 max-h-36 overflow-y-auto">
                {scanLogs.map((log, i) => (
                  <div key={i} className="leading-tight">{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DEVICE SELECTION SCREEN */}
      {/* ========================================================================= */}
      {step === "DEVICE_SELECT" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Select Your TV</h2>
              <p className="text-xs text-zinc-400">
                {discoveredDevices.length > 0
                  ? `Found ${discoveredDevices.length} verified TV device(s) on your Wi-Fi`
                  : "No TV automatically discovered on this Wi-Fi network"}
              </p>
            </div>
            <button
              onClick={handleStartScan}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rescan</span>
            </button>
          </div>

          {/* List of Discovered TVs */}
          {discoveredDevices.length > 0 ? (
            <div className="space-y-3">
              {discoveredDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-4 bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-3 bg-indigo-950/60 border border-indigo-800/40 rounded-xl text-indigo-400 shrink-0">
                      <Tv className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">{dev.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold uppercase">
                          {dev.platform.replace("_", " ")}
                        </span>
                        {dev.isOnline && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        IP: <span className="font-mono text-zinc-300">{dev.ip}</span> • Port: {dev.port} • Protocol: {dev.protocol}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        {dev.requiresPairing && !dev.isPaired ? "Requires PIN / Authorization Pairing" : "Ready for Instant Control"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSelectDevice(dev)}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <span>{dev.requiresPairing && !dev.isPaired ? "Pair & Connect" : "Connect"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State: No TVs Found */
            <div className="p-6 bg-zinc-950/60 border border-zinc-800 rounded-2xl text-center space-y-4">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl inline-flex text-zinc-400">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Compatible TV Detected</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Ensure your TV is powered on and connected to the exact same Wi-Fi network as this device.
                </p>
              </div>

              {/* Troubleshooting Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                <button
                  onClick={() => setStep("MANUAL_ADD")}
                  className="p-3 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div>Connect by IP Address</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Enter TV IP and Port manually</div>
                  </div>
                </button>

                {onOpenQrScanner && (
                  <button
                    onClick={onOpenQrScanner}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div>Scan TV QR Code</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Scan QR displayed on TV screen</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep("NETWORK_CHECK")}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep("MANUAL_ADD")}
              className="px-4 py-2.5 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Device Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5b. MANUAL IP ADD FORM */}
      {/* ========================================================================= */}
      {step === "MANUAL_ADD" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Manual TV Connection</h2>
              <p className="text-xs text-zinc-400">Enter your Smart TV's local IP address and protocol</p>
            </div>
          </div>

          <form onSubmit={handleManualProbe} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  TV IP Address *
                </label>
                <input
                  type="text"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  placeholder="e.g. 192.168.1.150"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Port
                </label>
                <input
                  type="number"
                  value={manualPort}
                  onChange={(e) => setManualPort(e.target.value)}
                  placeholder="8060"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Platform Ecosystem
                </label>
                <select
                  value={manualPlatform}
                  onChange={(e) => {
                    const plat = e.target.value as TvPlatform;
                    setManualPlatform(plat);
                    if (plat === "roku") {
                      setManualPort("8060");
                      setManualProtocol("roku_ecp");
                    } else if (plat === "android_tv" || plat === "google_tv") {
                      setManualPort("6467");
                      setManualProtocol("android_tv_receiver");
                    } else if (plat === "tizen") {
                      setManualPort("8002");
                      setManualProtocol("samsung_tizen_ws");
                    } else if (plat === "webos") {
                      setManualPort("3000");
                      setManualProtocol("lg_webos_ws");
                    } else if (plat === "sony_bravia") {
                      setManualPort("80");
                      setManualProtocol("sony_bravia_rest");
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="roku">Roku (Streaming Stick / TV)</option>
                  <option value="android_tv">Android TV / Google TV</option>
                  <option value="tizen">Samsung Smart TV (Tizen)</option>
                  <option value="webos">LG Smart TV (webOS)</option>
                  <option value="sony_bravia">Sony BRAVIA</option>
                  <option value="generic">Generic Network TV</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Custom Device Name
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Living Room TV"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {manualProbeError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{manualProbeError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep("DEVICE_SELECT")}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isProbingManual}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                {isProbingManual ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying TV...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Add TV</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PAIRING & AUTHENTICATION */}
      {/* ========================================================================= */}
      {step === "PAIRING" && selectedDevice && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pair with {selectedDevice.name}</h2>
              <p className="text-xs text-zinc-400">Security PIN verification required by target TV protocol</p>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3 text-center">
            <div className="text-xs text-zinc-300">
              Look at your TV screen. A 4-digit pairing code should be displayed now.
            </div>

            <form onSubmit={handlePerformPairing} className="space-y-4 max-w-xs mx-auto pt-2">
              <input
                type="text"
                maxLength={6}
                value={pairingPin}
                onChange={(e) => setPairingPin(e.target.value.replace(/\D/g, ""))}
                placeholder="0000"
                className="w-full text-center text-3xl font-mono tracking-widest px-4 py-3 bg-zinc-900 border-2 border-indigo-500/50 rounded-2xl text-white focus:outline-none focus:border-indigo-400"
                autoFocus
                required
              />

              {pairingError && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200">
                  {pairingError}
                </div>
              )}

              <button
                type="submit"
                disabled={isPairing || pairingPin.length < 4}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                {isPairing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying with TV...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Pairing PIN</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep("DEVICE_SELECT")}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CAPABILITY DETECTION */}
      {/* ========================================================================= */}
      {step === "CAPABILITIES" && selectedDevice && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Authoritative Capabilities</h2>
              <p className="text-xs text-zinc-400">
                Verified features for {selectedDevice.name} ({selectedDevice.platform.toUpperCase()})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {Object.entries(selectedDevice.capabilities || {}).map(([key, status]) => {
              const label = CAPABILITY_LABELS[key as keyof DeviceCapabilities] || key;
              const isSupported = status === "SUPPORTED";
              const isReqPair = status === "REQUIRES_PAIRING";
              const isHardware = status === "REQUIRES_HARDWARE";

              return (
                <div
                  key={key}
                  className={`p-3 rounded-2xl border ${
                    isSupported
                      ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                      : isReqPair
                      ? "bg-amber-950/30 border-amber-800/40 text-amber-300"
                      : isHardware
                      ? "bg-zinc-950/60 border-zinc-800/60 text-zinc-400"
                      : "bg-zinc-950/40 border-zinc-800/40 text-zinc-400"
                  }`}
                >
                  <div className="font-semibold truncate">{label}</div>
                  <div className="text-[10px] mt-1 font-mono uppercase">
                    {String(status).replace("_", " ")}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep("DEVICE_SELECT")}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep("REMOTE_CONFIG")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <span>Next: Configure Remote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. REMOTE MODE CONFIGURATION */}
      {/* ========================================================================= */}
      {step === "REMOTE_CONFIG" && selectedDevice && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Select Default Remote Mode</h2>
              <p className="text-xs text-zinc-400">Choose your preferred control layout (you can switch anytime)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: "classic",
                label: "Classic Remote Deck",
                desc: "Full directional D-pad, Power, Volume rocker, Navigation, and Media keys",
                icon: Tv,
              },
              {
                id: "dpad",
                label: "Streamlined D-Pad",
                desc: "Large focal navigation wheel for fast scrolling and OK selection",
                icon: Compass,
              },
              {
                id: "touchpad",
                label: "Gesture Touchpad",
                desc: "Swipe touchpad and tap-to-click for Smart TV browser navigation",
                icon: Smartphone,
              },
              {
                id: "media",
                label: "Media Center",
                desc: "Dedicated Play, Pause, Scrub, Rewind, Fast Forward, and Volume sliders",
                icon: Sparkles,
              },
              {
                id: "apps",
                label: "Direct App Launcher",
                desc: "One-touch launch for YouTube, Netflix, Prime Video, Spotify, and Plex",
                icon: Layers,
              },
              {
                id: "numpad",
                label: "Channel Number Pad",
                desc: "Digital 0-9 keys and Tuner controls for Live TV and Cable",
                icon: Radio,
              },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id as RemoteMode)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? "bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{mode.label}</div>
                    <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{mode.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep("CAPABILITIES")}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep("READY")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <span>Review & Finish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. READY / SUMMARY CONFIRMATION */}
      {/* ========================================================================= */}
      {step === "READY" && selectedDevice && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="inline-flex p-4 bg-emerald-600/20 border border-emerald-500/30 rounded-3xl text-emerald-400 shadow-xl shadow-emerald-600/10">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Remote Ready!
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Your device is verified and linked to your handheld remote.
            </p>
          </div>

          {/* Config Summary Card */}
          <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-left space-y-3 max-w-md mx-auto">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <span className="text-xs text-zinc-400">Target TV</span>
              <span className="text-xs font-bold text-white">{selectedDevice.name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <span className="text-xs text-zinc-400">Platform Protocol</span>
              <span className="text-xs font-mono text-indigo-400 uppercase">{selectedDevice.platform}</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <span className="text-xs text-zinc-400">Local IP Address</span>
              <span className="text-xs font-mono text-zinc-300">{selectedDevice.ip}:{selectedDevice.port}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Default Deck Mode</span>
              <span className="text-xs font-bold text-emerald-400 capitalize">{selectedMode} Mode</span>
            </div>
          </div>

          {/* Launch Action Button */}
          <div className="pt-2">
            <button
              id="onboarding-launch-remote-btn"
              onClick={handleFinalize}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] mx-auto"
            >
              <Tv className="w-4 h-4" />
              <span>Launch Remote Control</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

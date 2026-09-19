import React, { useState, useEffect, useRef } from "react";
import { TvDevice, RemoteMode, RemoteCommandType, ButtonMapping, ConnectionState } from "./core/types";
import { TransportRegistry } from "./transports/TransportRegistry";
import { CommandEngine } from "./core/commands/CommandEngine";
import { globalConnectionManager } from "./core/connection/ConnectionManager";
import { TokenVault } from "./pairing/tokenVault";
import { DiscoveryService } from "./discovery/discoveryService";
import { MobileRemoteView } from "./mobile/MobileRemoteView";
import { TvReceiverApp } from "./tv_receiver/TvReceiverApp";
import { DeviceScannerModal } from "./discovery/DeviceScannerModal";
import { PairingModal } from "./pairing/PairingModal";
import { TvSelectorModal } from "./components/TvSelectorModal";
import { CapabilityMatrixModal } from "./components/CapabilityMatrixModal";
import { VoiceRemoteModal } from "./remotes/VoiceRemoteModal";
import { ButtonMapperModal } from "./button-mapper/ButtonMapperModal";
import { CustomRemoteBuilderModal } from "./custom-builder/CustomRemoteBuilderModal";
import { LearnRemoteModal } from "./remotes/LearnRemoteModal";
import { DiagnosticsModal } from "./diagnostics/DiagnosticsModal";
import { ScenesModal } from "./scenes/ScenesModal";
import { ShareProfileModal } from "./sharing/ShareProfileModal";
import { PlatformProtocolDocsModal } from "./components/PlatformProtocolDocsModal";
import { GlobalRemoteLibraryModal } from "./components/GlobalRemoteLibraryModal";
import { CompatibilityCenterModal } from "./components/CompatibilityCenterModal";
import { IrBlasterModal } from "./ir/IrBlasterModal";
import { MobileQrScannerModal } from "./mobile/components/MobileQrScannerModal";
import { DownloadApkModal } from "./components/modals/DownloadApkModal";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import { CloudSyncModal } from "./components/modals/CloudSyncModal";
import { auth, onAuthChanged, subscribeToUserDevices, syncDeviceToCloud } from "./core/firebase";
import { User } from "firebase/auth";
import { DeviceProfile } from "./database/types";
import { validateTvTarget } from "./core/networkValidation";
import { AppLogo } from "./components/common/AppLogo";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { App as CapApp } from "@capacitor/app";
import { HapticsService } from "./utils/haptics";
import {
  Tv,
  Monitor,
  Smartphone,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Radio,
  Sliders,
  Sparkles,
  Wifi,
  Activity,
  Columns,
  BookOpen,
  LayoutGrid,
  ShieldCheck,
  Camera,
  QrCode,
  Wand2,
  Cloud,
  CloudCheck,
  RotateCcw,
  Download
} from "lucide-react";

export type InterfaceViewMode = "mobile" | "tv" | "dual";

function generateCryptographicPin(): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return String(100000 + (array[0] % 900000));
  }
  throw new Error("Secure random number generation is unavailable on this device.");
}

export default function App() {
  const [devices, setDevices] = useState<TvDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<RemoteMode>("classic");
  const [isSending, setIsSending] = useState(false);
  const [viewMode, setViewMode] = useState<InterfaceViewMode>("mobile");
  const [connectionState, setConnectionState] = useState<ConnectionState>("DISCONNECTED");

  // Companion & Telemetry State
  const [lastCommand, setLastCommand] = useState<{ command: string; value?: any; timestamp: string } | null>(null);
  const [pairingPin, setPairingPin] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; command: string; status: "success" | "error"; latencyMs?: number }>>([]);
  const [buttonMappings, setButtonMappings] = useState<ButtonMapping[]>([]);

  // Modals state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pairingTarget, setPairingTarget] = useState<TvDevice | null>(null);
  const [tvSelectorOpen, setTvSelectorOpen] = useState(false);
  const [capMatrixOpen, setCapMatrixOpen] = useState(false);
  const [protocolDocsOpen, setProtocolDocsOpen] = useState(false);
  const [voiceRemoteOpen, setVoiceRemoteOpen] = useState(false);
  const [buttonMapperOpen, setButtonMapperOpen] = useState(false);
  const [customBuilderOpen, setCustomBuilderOpen] = useState(false);
  const [learnRemoteOpen, setLearnRemoteOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [scenesOpen, setScenesOpen] = useState(false);
  const [shareProfileOpen, setShareProfileOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // New Global Remote Platform Modals
  const [remoteLibraryOpen, setRemoteLibraryOpen] = useState(false);
  const [compatibilityCenterOpen, setCompatibilityCenterOpen] = useState(false);
  const [compatProfileId, setCompatProfileId] = useState<string | undefined>(undefined);
  const [irBlasterOpen, setIrBlasterOpen] = useState(false);
  const [downloadApkOpen, setDownloadApkOpen] = useState(false);
  const [cloudSyncOpen, setCloudSyncOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth?.currentUser ?? null);
  const [selectedLibraryProfile, setSelectedLibraryProfile] = useState<DeviceProfile | null>(null);

  // Honest Alert / Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  // Startup Loading Screen
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // First-Launch Onboarding System ("Get Started" option upfront on app launch)
  const [isOnboarding, setIsOnboarding] = useState<boolean>(true);

  const socketRef = useRef<WebSocket | null>(null);

  // Auth & Cloud Sync Listener
  useEffect(() => {
    const unsubAuth = onAuthChanged((user) => {
      setFirebaseUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Real-time Firestore Cloud Device Sync
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubFirestore = subscribeToUserDevices(
      firebaseUser.uid,
      (cloudDevices) => {
        if (cloudDevices && cloudDevices.length > 0) {
          setDevices((prevLocal) => {
            // Merge cloud devices with local devices
            const mergedMap = new Map<string, TvDevice>();
            prevLocal.forEach((d) => mergedMap.set(d.id, d));
            cloudDevices.forEach((d) => mergedMap.set(d.id, d));
            const mergedList = Array.from(mergedMap.values());
            TokenVault.saveDevices(mergedList);
            return mergedList;
          });
        }
      },
      (err) => {
        console.warn("Firestore subscription note:", err.message);
      }
    );

    return () => unsubFirestore();
  }, [firebaseUser]);

  // 1. Initialize Saved Devices, Load from TokenVault & Check QR Deep Links
  useEffect(() => {
    const saved = TokenVault.getSavedDevices() || [];
    setDevices(saved);
    const active = TokenVault.getActiveDevice();
    if (active) {
      setCurrentDeviceId(active.id);
    } else if (saved && saved.length > 0) {
      setCurrentDeviceId(saved[0].id);
    }

    // Handle incoming QR Code deep link scan (e.g. ?pair=true&dev=...&ip=...)
    try {
      if (typeof window !== "undefined" && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const isPair = params.get("pair");
        const devId = params.get("dev");
        const ip = params.get("ip");
        const name = params.get("name") || "Smart TV Receiver";
        const port = Number(params.get("port")) || 6467;
        const proto = params.get("proto") || "android_tv_receiver";
        const pin = params.get("pin");

        if (isPair) {
          if (!ip) {
            showToast("QR pairing link missing TV IP address. Please scan TV directly.", "warning");
            return;
          }
          const cleanIp = ip.trim();
          const targetValidation = validateTvTarget(cleanIp, port);
          if (!targetValidation.valid) {
            showToast(targetValidation.error || "Invalid TV target in QR code.", "error");
            return;
          }

          const targetIp = cleanIp;
          const newDev: TvDevice = {
            id: devId || `tv_${targetIp.replace(/\./g, "_")}`,
            name: decodeURIComponent(name),
            brand: "Smart TV",
            model: "Smart TV Display",
            platform: (proto.includes("android") ? "android_tv" : proto.includes("roku") ? "roku" : "generic") as any,
            ip: targetIp,
            port,
            protocol: decodeURIComponent(proto),
            requiresPairing: true,
            isPaired: false,
            isOnline: false,
            capabilities: {
              power: "UNKNOWN",
              navigation: "UNKNOWN",
              volume: "UNKNOWN",
              media: "UNKNOWN",
              keyboard: "UNKNOWN",
              touchpad: "UNKNOWN",
              apps: "UNKNOWN",
              input: "UNKNOWN",
              voice: "UNKNOWN",
              channels: "UNKNOWN",
              ir: "UNSUPPORTED",
              bluetooth: "UNKNOWN",
              wifi: "UNKNOWN"
            },
            lastSeen: Date.now()
          };

          handleAddDevice(newDev);
          setPairingTarget(newDev);
          showToast(`Detected ${newDev.name} from QR code. Confirm pairing to connect.`, "warning");
        }
      }
    } catch (err) {
      console.error("Failed to parse URL QR pairing link:", err);
    }
  }, []);

  // 2. Optional companion WebSocket.
  // Do not let a missing/failed companion server prevent the remote UI from rendering.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let disposed = false;
    let ws: WebSocket | null = null;

    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/remote`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!disposed) socketRef.current = ws;
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "COMMAND_EXECUTED") {
            setLastCommand({
              command: data.command,
              value: data.value,
              timestamp: new Date().toLocaleTimeString(),
            });
          } else if (data.type === "PAIRING_STARTED") {
            setPairingPin(data.pin);
          } else if (data.type === "PAIRING_SUCCESS") {
            setPairingPin(null);
          }
        } catch (error) {
          console.warn("Ignoring malformed companion WebSocket message:", error);
        }
      };

      ws.onerror = () => {
        // Companion mode is optional; direct/native TV control remains available.
        if (socketRef.current === ws) socketRef.current = null;
      };

      ws.onclose = () => {
        if (socketRef.current === ws) socketRef.current = null;
      };
    } catch (error) {
      console.warn("Companion WebSocket unavailable; continuing without it:", error);
    }

    return () => {
      disposed = true;
      if (socketRef.current === ws) socketRef.current = null;
      try {
        ws?.close();
      } catch {}
    };
  }, []);

  // Android Hardware Back Button Handling via Capacitor App
  useEffect(() => {
    let listenerHandle: any = null;

    try {
      CapApp.addListener("backButton", ({ canGoBack }) => {
        // Priority 1: Close active modals
        if (scannerOpen) { setScannerOpen(false); return; }
        if (pairingTarget) { setPairingTarget(null); return; }
        if (tvSelectorOpen) { setTvSelectorOpen(false); return; }
        if (capMatrixOpen) { setCapMatrixOpen(false); return; }
        if (protocolDocsOpen) { setProtocolDocsOpen(false); return; }
        if (voiceRemoteOpen) { setVoiceRemoteOpen(false); return; }
        if (buttonMapperOpen) { setButtonMapperOpen(false); return; }
        if (customBuilderOpen) { setCustomBuilderOpen(false); return; }
        if (learnRemoteOpen) { setLearnRemoteOpen(false); return; }
        if (diagnosticsOpen) { setDiagnosticsOpen(false); return; }
        if (scenesOpen) { setScenesOpen(false); return; }
        if (shareProfileOpen) { setShareProfileOpen(false); return; }
        if (qrScannerOpen) { setQrScannerOpen(false); return; }
        if (remoteLibraryOpen) { setRemoteLibraryOpen(false); return; }
        if (compatibilityCenterOpen) { setCompatibilityCenterOpen(false); return; }
        if (irBlasterOpen) { setIrBlasterOpen(false); return; }
        if (cloudSyncOpen) { setCloudSyncOpen(false); return; }
        if (isOnboarding) { setIsOnboarding(false); return; }

        // Priority 2: Standard history back or exit
        if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      }).then((handle) => {
        listenerHandle = handle;
      }).catch(() => {});
    } catch {}

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === "function") {
        listenerHandle.remove();
      }
    };
  }, [
    scannerOpen, pairingTarget, tvSelectorOpen, capMatrixOpen, protocolDocsOpen,
    voiceRemoteOpen, buttonMapperOpen, customBuilderOpen, learnRemoteOpen,
    diagnosticsOpen, scenesOpen, shareProfileOpen, qrScannerOpen, remoteLibraryOpen,
    compatibilityCenterOpen, irBlasterOpen, cloudSyncOpen, isOnboarding
  ]);

  const currentDevice = devices.find(d => d.id === currentDeviceId) || null;

  // Real-time synchronization with ConnectionManager (heartbeat, latency, state)
  useEffect(() => {
    const unsub = globalConnectionManager.subscribe((state, _dev, info) => {
      setConnectionState(state);
      if (info?.error && state === "ERROR") {
        showToast(info.error, "error");
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    globalConnectionManager.setActiveDevice(currentDevice);
  }, [currentDeviceId, currentDevice?.isPaired, currentDevice?.token, currentDevice?.ip]);

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Switch active TV
  const handleSelectDevice = (dev: TvDevice) => {
    setCurrentDeviceId(dev.id);
    TokenVault.setActiveDeviceId(dev.id);
    showToast(`Switched active TV to ${dev.name}`, "success");
  };

  // Add newly discovered TV
  const handleAddDevice = (newDev: TvDevice) => {
    setDevices(prev => {
      const exists = prev.some(d => d.id === newDev.id);
      const updated = exists ? prev.map(d => (d.id === newDev.id ? newDev : d)) : [...prev, newDev];
      TokenVault.saveDevice(newDev);
      return updated;
    });
    setCurrentDeviceId(newDev.id);
    TokenVault.setActiveDeviceId(newDev.id);
    if (firebaseUser) {
      syncDeviceToCloud(firebaseUser.uid, newDev).catch((e) =>
        console.warn("Cloud sync error:", e)
      );
    }
    showToast(`Added ${newDev.name}`, "success");
  };

  // Select device from Global Remote Library Profile
  const handleSelectFromLibrary = (profile: DeviceProfile) => {
    setRemoteLibraryOpen(false);

    // If IR Universal profile, instantiate direct optical IR device without network IP
    if (profile.platform === "ir_universal") {
      const irDev: TvDevice = {
        id: `ir_${profile.id}_${Date.now().toString(36)}`,
        name: `${profile.brand} ${profile.series || profile.model} (IR)`,
        model: profile.model,
        platform: "ir_universal",
        ip: "",
        port: 0,
        protocol: "ir_universal",
        requiresPairing: false,
        isPaired: true,
        isOnline: true,
        capabilities: profile.defaultCapabilities,
        brand: profile.brand,
        series: profile.series,
        lastSeen: Date.now()
      };
      handleAddDevice(irDev);
      showToast(`Added ${profile.brand} IR remote profile (38kHz Optical).`, "success");
      return;
    }

    // Network profiles must be verified against actual TV IP address
    setSelectedLibraryProfile(profile);
    setScannerOpen(true);
    showToast(`Selected ${profile.brand} ${profile.series || profile.model}. Enter your TV's Wi-Fi IP to verify connection.`, "warning");
  };

  // Update TV (e.g. rename or toggle favorite)
  const handleUpdateDevice = (updated: TvDevice) => {
    setDevices(prev => {
      const list = prev.map(d => (d.id === updated.id ? updated : d));
      TokenVault.saveDevice(updated);
      return list;
    });
    if (firebaseUser) {
      syncDeviceToCloud(firebaseUser.uid, updated).catch((e) =>
        console.warn("Cloud sync error:", e)
      );
    }
  };

  // Remove TV
  const handleRemoveDevice = (deviceId: string) => {
    setDevices(prev => {
      const list = prev.filter(d => d.id !== deviceId);
      TokenVault.removeDevice(deviceId);
      return list;
    });
    if (currentDeviceId === deviceId) {
      const remaining = (devices || []).filter(d => d.id !== deviceId);
      setCurrentDeviceId(remaining && remaining.length > 0 ? remaining[0].id : null);
    }
    showToast("Device removed", "success");
  };

  // Pairing Completed
  const handlePairingSuccess = (pairedDevice: TvDevice) => {
    setDevices(prev => {
      const list = prev.map(d => (d.id === pairedDevice.id ? pairedDevice : d));
      TokenVault.saveDevice(pairedDevice);
      return list;
    });
    setPairingPin(null);
    if (firebaseUser) {
      syncDeviceToCloud(firebaseUser.uid, pairedDevice).catch((e) =>
        console.warn("Cloud sync error:", e)
      );
    }
    showToast(`Pairing verified with ${pairedDevice.name}! Remote authorized.`, "success");
  };

  // QR Camera Scan Completed
  const handleQrScanSuccess = (scannedDevice: TvDevice, pin?: string) => {
    handleAddDevice(scannedDevice);
    if (pin) {
      handlePairingSuccess(scannedDevice);
    } else {
      setPairingTarget(scannedDevice);
    }
    showToast(`Connected to TV from QR Code: ${scannedDevice.name}`, "success");
  };

  // Onboarding Completion Handler
  const handleOnboardingComplete = (selectedDev: TvDevice, initialMode: RemoteMode) => {
    handleAddDevice(selectedDev);
    setCurrentMode(initialMode);
    setIsOnboarding(false);
    showToast(`Connected to ${selectedDev.name}! Remote ready.`, "success");
  };

  // Command Execution: Runs strictly through CommandEngine -> CapabilityEngine -> TvAdapter -> Transport
  const handleSendCommand = async (command: RemoteCommandType, value?: any): Promise<boolean> => {
    if (command === "POWER") {
      HapticsService.heavy().catch(() => {});
    } else {
      HapticsService.light().catch(() => {});
    }

    if (!currentDevice) {
      showToast("No compatible TV connected. Please scan Wi-Fi or select a TV.", "warning");
      return false;
    }

    setIsSending(true);

    try {
      const res = await CommandEngine.execute(currentDevice, command, value);

      if (res.success) {
        setLastCommand({
          command,
          value,
          timestamp: new Date().toLocaleTimeString()
        });
        setLogs(prev => [
          { timestamp: new Date().toLocaleTimeString(), command, status: "success", latencyMs: res.latencyMs },
          ...prev.slice(0, 49)
        ]);
        return true;
      } else {
        showToast(res.error || "Command delivery failed on TV adapter.", "error");
        setLogs(prev => [
          { timestamp: new Date().toLocaleTimeString(), command, status: "error", latencyMs: res.latencyMs },
          ...prev.slice(0, 49)
        ]);
        return false;
      }
    } catch (err: any) {
      showToast(`Command error: ${err.message}`, "error");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="app-shell min-h-screen text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Premium Universal Remote Header */}
      <header className="sticky top-0 z-40 remote-header border-b border-white/[0.07] bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-7">
          <div className="flex min-h-16 items-center gap-3 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <AppLogo size="sm" showText={false} animated={true} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">Universal Remote</h1>
                  <span className="hidden rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300 sm:inline-flex">Multi-Protocol</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${connectionState === "CONNECTED" ? "bg-emerald-400" : connectionState === "CONNECTING" ? "bg-amber-400 animate-pulse" : "bg-zinc-600"}`} />
                  <span className="truncate">{currentDevice ? currentDevice.name : "No TV selected"}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="hidden sm:inline">{connectionState === "CONNECTED" ? "Connected" : connectionState === "CONNECTING" ? "Connecting…" : "Ready to connect"}</span>
                </div>
              </div>
            </div>

            <div className="remote-glass flex shrink-0 items-center gap-1.5 rounded-2xl p-1">
              <button onClick={() => setScannerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-500 active:scale-95" title="Find TVs on Wi-Fi">
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Scan</span>
              </button>
              <button onClick={() => setTvSelectorOpen(true)} className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white sm:inline-flex" title="Choose active TV">
                <Tv className="h-3.5 w-3.5" />
                <span>TVs</span>
              </button>
              <button onClick={() => setRemoteLibraryOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white" title="Open remote library">
                <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden md:inline">Library</span>
              </button>
            </div>
          </div>

          <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto pb-2.5 pt-0.5">
            <button onClick={() => setIsOnboarding(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-[11px] font-semibold text-indigo-200 transition hover:bg-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" /> Get Started
            </button>
            <button onClick={() => setQrScannerOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white">
              <Camera className="h-3.5 w-3.5 text-cyan-400" /> TV QR
            </button>
            <button onClick={() => setCompatibilityCenterOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/10">
              <ShieldCheck className="h-3.5 w-3.5" /> Compatibility
            </button>
            <button onClick={() => setIrBlasterOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white">
              <Radio className="h-3.5 w-3.5 text-amber-400" /> IR Blaster
            </button>
            <button onClick={() => setVoiceRemoteOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white">
              <Activity className="h-3.5 w-3.5 text-violet-400" /> Voice
            </button>
            <button onClick={() => setScenesOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white">
              <Layers className="h-3.5 w-3.5 text-cyan-400" /> Scenes
            </button>
            <button onClick={() => setDiagnosticsOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white">
              <Activity className="h-3.5 w-3.5 text-emerald-400" /> Diagnostics
            </button>
            <button onClick={() => setButtonMapperOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white">
              <Sliders className="h-3.5 w-3.5 text-indigo-400" /> Customize
            </button>
            <button onClick={() => setProtocolDocsOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white">
              <BookOpen className="h-3.5 w-3.5 text-blue-400" /> Protocols
            </button>
            <button onClick={() => setCloudSyncOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white">
              {firebaseUser ? <CloudCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Cloud className="h-3.5 w-3.5 text-indigo-400" />} Cloud Sync
            </button>
            <button onClick={() => setDownloadApkOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/10">
              <Download className="h-3.5 w-3.5" /> APK Release
            </button>
            <div className="ml-auto flex shrink-0 items-center rounded-xl border border-zinc-800 bg-zinc-900 p-1">
              {([["mobile", Smartphone, "Phone"], ["tv", Monitor, "TV"], ["dual", Columns, "Dual"]] as const).map(([mode, Icon, label]) => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${viewMode === mode ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`} title={`Switch to ${label} view`}>
                  <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 overflow-x-hidden">
        
        {/* Toast Alert */}
        {toast && (
          <div
            id="app-toast-alert"
            className={`fixed top-16 right-3 left-3 sm:left-auto sm:right-6 z-50 p-3.5 rounded-2xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 sm:max-w-md animate-in fade-in slide-in-from-top-4 duration-200 ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : toast.type === "warning"
                ? "bg-amber-950/90 border-amber-500/50 text-amber-200"
                : "bg-rose-950/90 border-rose-500/50 text-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 0. Professional First-Launch Onboarding System */}
        {isOnboarding ? (
          <OnboardingFlow
            existingDevices={devices}
            onComplete={handleOnboardingComplete}
            onCancel={devices.length > 0 ? () => setIsOnboarding(false) : undefined}
            onOpenQrScanner={() => setQrScannerOpen(true)}
          />
        ) : (
          <>
            {/* 1. Dedicated Mobile View (Pure Phone Remote Experience) */}
            {viewMode === "mobile" && (
              <div className="w-full max-w-md mx-auto">
                <MobileRemoteView
                  device={currentDevice}
                  connectionState={connectionState}
                  currentMode={currentMode}
                  onSelectMode={setCurrentMode}
                  onSendCommand={handleSendCommand}
                  isSending={isSending}
                  onOpenTvSelector={() => setTvSelectorOpen(true)}
                  onOpenCapabilityMatrix={() => setCapMatrixOpen(true)}
                  onOpenQrScanner={() => setQrScannerOpen(true)}
                  onOpenPairing={() => {
                    if (currentDevice) setPairingTarget(currentDevice);
                  }}
                  onOpenVoiceRemote={() => setVoiceRemoteOpen(true)}
                  onOpenButtonMapper={() => setButtonMapperOpen(true)}
                  onOpenCustomBuilder={() => setCustomBuilderOpen(true)}
                  onOpenLearnRemote={() => setLearnRemoteOpen(true)}
                  onOpenDiagnostics={() => setDiagnosticsOpen(true)}
                  onOpenScenes={() => setScenesOpen(true)}
                  onOpenShareProfile={() => setShareProfileOpen(true)}
                  onOpenRemoteLibrary={() => setRemoteLibraryOpen(true)}
                  onOpenCompatibilityCenter={() => setCompatibilityCenterOpen(true)}
                  onOpenIrBlaster={() => setIrBlasterOpen(true)}
                  onOpenDownloadApk={() => setDownloadApkOpen(true)}
                  onUnsupportedAttempt={(reason) => showToast(reason, "warning")}
                />
              </div>
            )}

            {/* 2. Dedicated TV Receiver View (Pure 10-Foot TV Experience) */}
            {viewMode === "tv" && (
              <div className="w-full">
                <TvReceiverApp
                  device={currentDevice}
                  lastCommand={lastCommand}
                  pairingPin={pairingPin}
                  onGeneratePin={() => {
                    const newPin = generateCryptographicPin();
                    setPairingPin(newPin);
                    showToast(`New pairing PIN generated: ${newPin}`, "success");
                  }}
                />
              </div>
            )}

            {/* 3. Dual Studio View (Both Side-by-Side) */}
            {viewMode === "dual" && (
              <div className="w-full max-w-screen overflow-x-hidden grid gap-6 sm:gap-8 items-start grid-cols-1 lg:grid-cols-12">
                
                {/* Mobile Remote Column */}
                <div className="w-full lg:col-span-5 xl:col-span-5">
                  <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3 px-1 text-xs font-bold text-indigo-400">
                      <Smartphone className="w-4 h-4" />
                      <span>MOBILE REMOTE UI</span>
                    </div>
                    <MobileRemoteView
                      device={currentDevice}
                      connectionState={connectionState}
                      currentMode={currentMode}
                      onSelectMode={setCurrentMode}
                      onSendCommand={handleSendCommand}
                      isSending={isSending}
                      onOpenTvSelector={() => setTvSelectorOpen(true)}
                      onOpenCapabilityMatrix={() => setCapMatrixOpen(true)}
                      onOpenQrScanner={() => setQrScannerOpen(true)}
                      onOpenPairing={() => {
                        if (currentDevice) setPairingTarget(currentDevice);
                      }}
                      onOpenVoiceRemote={() => setVoiceRemoteOpen(true)}
                      onOpenButtonMapper={() => setButtonMapperOpen(true)}
                      onOpenCustomBuilder={() => setCustomBuilderOpen(true)}
                      onOpenLearnRemote={() => setLearnRemoteOpen(true)}
                      onOpenDiagnostics={() => setDiagnosticsOpen(true)}
                      onOpenScenes={() => setScenesOpen(true)}
                      onOpenShareProfile={() => setShareProfileOpen(true)}
                      onOpenRemoteLibrary={() => setRemoteLibraryOpen(true)}
                      onOpenCompatibilityCenter={() => setCompatibilityCenterOpen(true)}
                      onOpenIrBlaster={() => setIrBlasterOpen(true)}
                      onUnsupportedAttempt={(reason) => showToast(reason, "warning")}
                    />
                  </div>
                </div>

                {/* Android TV Receiver Screen Column */}
                <div className="w-full lg:col-span-7 xl:col-span-7 space-y-4">
                  <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3 px-1 text-xs font-bold text-indigo-400">
                      <Monitor className="w-4 h-4" />
                      <span>ANDROID TV / GOOGLE TV 10-FOOT RECEIVER UI</span>
                    </div>
                    <TvReceiverApp
                      device={currentDevice}
                      lastCommand={lastCommand}
                      pairingPin={pairingPin}
                      onGeneratePin={() => {
                        const newPin = generateCryptographicPin();
                        setPairingPin(newPin);
                        showToast(`New pairing PIN generated: ${newPin}`, "success");
                      }}
                    />
                  </div>
                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* ALL INTERACTIVE MODALS */}
      <DeviceScannerModal
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setSelectedLibraryProfile(null);
        }}
        devices={devices}
        currentDeviceId={currentDeviceId}
        onSelectDevice={handleSelectDevice}
        onPairDevice={(dev) => setPairingTarget(dev)}
        onRefreshDevices={async () => {
          try {
            const scanned = await DiscoveryService.scanNetwork();
            setDevices(scanned);
            TokenVault.saveDevices(scanned);
          } catch {}
        }}
        onDevicePaired={handleAddDevice}
        onOpenQrScanner={() => setQrScannerOpen(true)}
        initialProfile={selectedLibraryProfile}
        onClearInitialProfile={() => setSelectedLibraryProfile(null)}
      />

      {pairingTarget && (
        <PairingModal
          isOpen={!!pairingTarget}
          onClose={() => setPairingTarget(null)}
          device={pairingTarget}
          onPairedSuccess={handlePairingSuccess}
          onOpenScanner={() => setQrScannerOpen(true)}
        />
      )}

      <TvSelectorModal
        isOpen={tvSelectorOpen}
        onClose={() => setTvSelectorOpen(false)}
        devices={devices}
        currentDeviceId={currentDeviceId}
        onSelectDevice={handleSelectDevice}
        onUpdateDevice={handleUpdateDevice}
        onRemoveDevice={handleRemoveDevice}
        onOpenScanner={() => setScannerOpen(true)}
        onOpenPairing={(dev) => setPairingTarget(dev)}
        onOpenQrScanner={() => setQrScannerOpen(true)}
      />

      <MobileQrScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      <CapabilityMatrixModal
        device={currentDevice}
        isOpen={capMatrixOpen}
        onClose={() => setCapMatrixOpen(false)}
        onOpenPairing={() => {
          if (currentDevice) setPairingTarget(currentDevice);
        }}
        onOpenProtocolDocs={() => setProtocolDocsOpen(true)}
      />

      <PlatformProtocolDocsModal
        isOpen={protocolDocsOpen}
        onClose={() => setProtocolDocsOpen(false)}
        initialPlatform={currentDevice?.platform || "android_tv"}
      />

      <GlobalRemoteLibraryModal
        isOpen={remoteLibraryOpen}
        onClose={() => setRemoteLibraryOpen(false)}
        onSelectDeviceProfile={handleSelectFromLibrary}
        onOpenCompatibilityCenter={(id) => {
          setCompatProfileId(id);
          setCompatibilityCenterOpen(true);
        }}
      />

      <CompatibilityCenterModal
        isOpen={compatibilityCenterOpen}
        onClose={() => {
          setCompatibilityCenterOpen(false);
          setCompatProfileId(undefined);
        }}
        initialProfileId={compatProfileId}
        onConnectDevice={handleSelectFromLibrary}
      />

      <IrBlasterModal
        isOpen={irBlasterOpen}
        onClose={() => setIrBlasterOpen(false)}
      />

      <VoiceRemoteModal
        device={currentDevice}
        isOpen={voiceRemoteOpen}
        onClose={() => setVoiceRemoteOpen(false)}
        onSendCommand={handleSendCommand}
      />

      <ButtonMapperModal
        device={currentDevice}
        isOpen={buttonMapperOpen}
        onClose={() => setButtonMapperOpen(false)}
        onSaveMapping={(m) => {
          setButtonMappings(prev => [...prev, m]);
          showToast(`Mapped custom button "${m.label}"`, "success");
        }}
      />

      <CustomRemoteBuilderModal
        device={currentDevice}
        isOpen={customBuilderOpen}
        onClose={() => setCustomBuilderOpen(false)}
        onSaveRemote={(profile) => {
          showToast(`Custom remote deck "${profile.name}" saved!`, "success");
        }}
      />

      <LearnRemoteModal
        device={currentDevice}
        isOpen={learnRemoteOpen}
        onClose={() => setLearnRemoteOpen(false)}
        onSaveCustomCommand={(name) => {
          showToast(`Saved custom command "${name}"`, "success");
        }}
      />

      <DiagnosticsModal
        device={currentDevice}
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        logs={logs}
      />

      <ScenesModal
        device={currentDevice}
        isOpen={scenesOpen}
        onClose={() => setScenesOpen(false)}
        onExecuteCommand={handleSendCommand}
      />

      <CloudSyncModal
        isOpen={cloudSyncOpen}
        onClose={() => setCloudSyncOpen(false)}
        localDevices={devices}
      />

      <DownloadApkModal
        isOpen={downloadApkOpen}
        onClose={() => setDownloadApkOpen(false)}
      />

      <ShareProfileModal
        isOpen={shareProfileOpen}
        onClose={() => setShareProfileOpen(false)}
        devices={devices}
        mappings={buttonMappings}
        onImportProfile={(imported) => {
          if (imported.devices) {
            setDevices(imported.devices);
            TokenVault.saveDevices(imported.devices);
          }
          if (imported.mappings) {
            setButtonMappings(imported.mappings);
          }
          showToast("Profile imported successfully!", "success");
        }}
      />

    </div>
  );
}

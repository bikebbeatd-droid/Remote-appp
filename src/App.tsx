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
  Columns
} from "lucide-react";

export type InterfaceViewMode = "mobile" | "tv" | "dual";

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
  const [voiceRemoteOpen, setVoiceRemoteOpen] = useState(false);
  const [buttonMapperOpen, setButtonMapperOpen] = useState(false);
  const [customBuilderOpen, setCustomBuilderOpen] = useState(false);
  const [learnRemoteOpen, setLearnRemoteOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [scenesOpen, setScenesOpen] = useState(false);
  const [shareProfileOpen, setShareProfileOpen] = useState(false);

  // Honest Alert / Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  // 1. Initialize Saved Devices & Load from TokenVault
  useEffect(() => {
    const saved = TokenVault.getSavedDevices() || [];
    setDevices(saved);
    const active = TokenVault.getActiveDevice();
    if (active) {
      setCurrentDeviceId(active.id);
    } else if (saved && saved.length > 0) {
      setCurrentDeviceId(saved[0].id);
    }
  }, []);

  // 2. Real-time WebSocket connection to TV Receiver companion
  useEffect(() => {
    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/remote`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Connected to local TV bridge
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "COMMAND_EXECUTED") {
            setLastCommand({
              command: data.command,
              value: data.value,
              timestamp: new Date().toLocaleTimeString()
            });
          } else if (data.type === "PAIRING_STARTED") {
            setPairingPin(data.pin);
          } else if (data.type === "PAIRING_SUCCESS") {
            setPairingPin(null);
          }
        } catch {}
      };

      socketRef.current = ws;
      return () => {
        ws.close();
      };
    } catch {}
  }, []);

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
    showToast(`Added ${newDev.name}`, "success");
  };

  // Update TV (e.g. rename or toggle favorite)
  const handleUpdateDevice = (updated: TvDevice) => {
    setDevices(prev => {
      const list = prev.map(d => (d.id === updated.id ? updated : d));
      TokenVault.saveDevice(updated);
      return list;
    });
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
    showToast(`Pairing verified with ${pairedDevice.name}! Remote authorized.`, "success");
  };

  // Command Execution: Runs strictly through CommandEngine -> CapabilityEngine -> TvAdapter -> Transport
  const handleSendCommand = async (command: RemoteCommandType, value?: any): Promise<boolean> => {
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2 max-w-full overflow-hidden">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base text-zinc-100 tracking-tight flex items-center gap-1.5 truncate">
              <span className="truncate">Universal TV Studio</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium shrink-0">
                v2.0
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 hidden md:block truncate">
              Dedicated Mobile Controller & Android TV / Google TV Receiver UI
            </p>
          </div>
        </div>

        {/* Global Interface Switcher (Mobile vs TV Receiver vs Dual Studio) */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 shrink-0">
          <button
            id="view-mode-mobile-btn"
            onClick={() => setViewMode("mobile")}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "mobile"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Switch to Mobile Phone Remote View"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phone Remote</span>
          </button>

          <button
            id="view-mode-tv-btn"
            onClick={() => setViewMode("tv")}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "tv"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Switch to 10-Foot Android TV Receiver View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TV Receiver (10ft)</span>
          </button>

          <button
            id="view-mode-dual-btn"
            onClick={() => setViewMode("dual")}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "dual"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Switch to Dual Studio Mode (Phone + TV Side-by-Side)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dual Studio</span>
          </button>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Network Scanner Button */}
          <button
            id="header-scan-network-btn"
            onClick={() => setScannerOpen(true)}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Scan Wi-Fi Network for TVs"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">Scan Wi-Fi</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        
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
                const newPin = String(Math.floor(1000 + Math.random() * 9000));
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
                    const newPin = String(Math.floor(1000 + Math.random() * 9000));
                    setPairingPin(newPin);
                    showToast(`New pairing PIN generated: ${newPin}`, "success");
                  }}
                />
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ALL INTERACTIVE MODALS */}
      <DeviceScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
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
      />

      {pairingTarget && (
        <PairingModal
          isOpen={!!pairingTarget}
          onClose={() => setPairingTarget(null)}
          device={pairingTarget}
          onPairedSuccess={handlePairingSuccess}
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
      />

      <CapabilityMatrixModal
        device={currentDevice}
        isOpen={capMatrixOpen}
        onClose={() => setCapMatrixOpen(false)}
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
        onSaveRemote={(name) => {
          showToast(`Custom remote deck "${name}" saved!`, "success");
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

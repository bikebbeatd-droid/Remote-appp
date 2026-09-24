import React, { useState, useEffect } from "react";
import { TvDevice } from "../core/types";
import { DeviceProfile } from "../database/types";
import { DiscoveryService } from "./discoveryService";
import { CAPABILITY_LABELS, getCapabilityBadgeColor } from "../core/capabilities";
import {
  Search,
  Tv,
  Wifi,
  Radio,
  Plus,
  RefreshCw,
  CheckCircle2,
  Lock,
  Unlock,
  X,
  Sparkles,
  Server,
  Sliders,
  ChevronRight,
  Info,
  Camera,
  Layers
} from "lucide-react";

interface DeviceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices?: TvDevice[];
  currentDeviceId?: string | null;
  onSelectDevice?: (device: TvDevice) => void;
  onPairDevice?: (device: TvDevice) => void;
  onRefreshDevices?: () => Promise<void>;
  onDevicePaired?: (device: TvDevice) => void;
  onOpenQrScanner?: () => void;
  initialProfile?: DeviceProfile | null;
  onClearInitialProfile?: () => void;
}

export const DeviceScannerModal: React.FC<DeviceScannerModalProps> = ({
  isOpen,
  onClose,
  devices = [],
  currentDeviceId = null,
  onSelectDevice,
  onPairDevice,
  onRefreshDevices,
  onDevicePaired,
  onOpenQrScanner,
  initialProfile = null,
  onClearInitialProfile
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualIp, setManualIp] = useState("");
  const [manualPort, setManualPort] = useState("");
  const [manualProtocol, setManualProtocol] = useState("roku_ecp");
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [probeResult, setProbeResult] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile && isOpen) {
      setShowManualAdd(true);
      if (initialProfile.defaultPort) {
        setManualPort(String(initialProfile.defaultPort));
      } else {
        setManualPort("");
      }
      if (initialProfile.protocol) {
        setManualProtocol(initialProfile.protocol);
      }
      setProbeResult(null);
    }
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const handleScan = async () => {
    setIsScanning(true);
    setProbeResult(null);
    try {
      if (onRefreshDevices) {
        await onRefreshDevices();
      }
    } finally {
      setTimeout(() => setIsScanning(false), 600);
    }
  };

  const handleManualProbe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp) return;

    const trimmedIp = manualIp.trim();
    if (trimmedIp === "127.0.0.1" || trimmedIp === "localhost") {
      setProbeResult("❌ 127.0.0.1 is your phone's Termux backend, not your TV! Enter the TV's Wi-Fi LAN IP (e.g. 192.168.1.x).");
      return;
    }

    setIsScanning(true);
    setProbeResult(null);
    try {
      const portNum = manualPort ? parseInt(manualPort, 10) : undefined;
      const res = await DiscoveryService.probeIp(trimmedIp, portNum, manualProtocol);
      if (res.success && res.device) {
        const enrichedDevice: TvDevice = {
          ...res.device,
          brand: initialProfile?.brand || res.device.brand || "Smart TV",
          series: initialProfile?.series || res.device.series,
          model: initialProfile?.model || res.device.model,
          platform: (initialProfile?.platform || res.device.platform) as any,
          capabilities: initialProfile?.defaultCapabilities || res.device.capabilities,
          requiresPairing: initialProfile ? initialProfile.pairingMethod !== "NONE" : res.device.requiresPairing,
          isPaired: initialProfile ? initialProfile.pairingMethod === "NONE" : res.device.isPaired
        };
        setProbeResult(`Found device: ${enrichedDevice.name} (${enrichedDevice.protocol})`);
        onSelectDevice?.(enrichedDevice);
        onDevicePaired?.(enrichedDevice);
      } else {
        setProbeResult(`Probe failed: ${res.error || "No responsive TV at this address"}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Add IR Device directly if IR profile is chosen (requires native IR hardware/bridge)
  const handleAddIrDevice = () => {
    if (!initialProfile) return;
    const irDev: TvDevice = {
      id: `ir_${initialProfile.id}_${Date.now().toString(36)}`,
      name: `${initialProfile.brand} ${initialProfile.series || initialProfile.model} (IR)`,
      brand: initialProfile.brand,
      series: initialProfile.series,
      model: initialProfile.model,
      platform: "ir_universal",
      protocol: "ir_universal",
      ip: "",
      port: 0,
      requiresPairing: false,
      isPaired: true,
      isOnline: false,
      capabilities: initialProfile.defaultCapabilities,
      lastSeen: Date.now()
    };
    onSelectDevice?.(irDev);
    onDevicePaired?.(irDev);
    onClose();
  };

  const safeDeviceList = Array.isArray(devices) ? devices : [];

  return (
    <div id="device-scanner-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="device-scanner-card" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">Network Device Scanner</h3>
              <p className="text-xs text-zinc-400">Discovering Smart TVs, Android TV Receivers & Streaming Devices</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="refresh-scanner-btn"
              onClick={handleScan}
              disabled={isScanning}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-medium text-zinc-200 rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-indigo-400" : ""}`} />
              <span>{isScanning ? "Scanning..." : "Rescan"}</span>
            </button>
            <button
              id="close-scanner-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Device List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Active Profile Configuration Banner */}
          {initialProfile && (
            <div className="p-4 bg-indigo-950/50 border border-indigo-500/50 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>Configuring Profile: {initialProfile.brand} {initialProfile.series || initialProfile.model}</span>
                </div>
                {onClearInitialProfile && (
                  <button
                    onClick={onClearInitialProfile}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-800"
                  >
                    Clear Profile
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-300">
                Protocol: <span className="font-mono text-indigo-300">{initialProfile.protocol}</span>
                {initialProfile.defaultPort ? <span> | Port: <span className="font-mono text-indigo-300">{initialProfile.defaultPort}</span></span> : null}
              </p>
              {initialProfile.platform === "ir_universal" ? (
                <div className="pt-2 border-t border-indigo-500/30 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-amber-300">
                    IR remotes operate optically via built-in phone IR blaster hardware or local IR bridge (no Wi-Fi IP needed).
                  </span>
                  <button
                    id="add-ir-device-btn"
                    onClick={handleAddIrDevice}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
                  >
                    Add as IR Blaster Remote
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400">
                  Enter your TV's Wi-Fi LAN IP below to verify connection and save this profile.
                </p>
              )}
            </div>
          )}
          {/* Termux Architecture Note */}
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-200">Termux Backend Notice: </span>
              <span>
                If running the backend via Termux on your phone, <code className="text-indigo-300 font-mono">127.0.0.1:3000</code> connects the app to your Termux service. Your Smart TV is located on your local Wi-Fi LAN with its own real IP (e.g. <code className="text-zinc-300 font-mono">192.168.1.x</code>).
              </span>
            </div>
          </div>

          {/* Quick QR Camera Scanner Banner */}
          {onOpenQrScanner && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 rounded-xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant QR Code Pairing</h4>
                  <p className="text-[11px] text-zinc-400">Point your camera at the QR code displayed on the TV screen</p>
                </div>
              </div>
              <button
                id="scanner-open-qr-camera-btn"
                onClick={() => {
                  onClose();
                  onOpenQrScanner();
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pb-1">
            <span>Discovered Devices on Local Network ({safeDeviceList.length})</span>
            <button
              id="toggle-manual-add-btn"
              onClick={() => setShowManualAdd(!showManualAdd)}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showManualAdd ? "Hide Custom IP" : "Add by IP Address"}</span>
            </button>
          </div>

          {/* Manual IP Probe Form */}
          {showManualAdd && (
            <form onSubmit={handleManualProbe} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
              <div className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Probe Custom Smart TV IP</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  id="manual-ip-input"
                  type="text"
                  placeholder="e.g. 192.168.1.150 (not 127.0.0.1)"
                  value={manualIp}
                  onChange={e => setManualIp(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 outline-none"
                />
                <input
                  id="manual-port-input"
                  type="number"
                  placeholder="Port (e.g. 8060, 8002)"
                  value={manualPort}
                  onChange={e => setManualPort(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 outline-none"
                />
                <select
                  id="manual-protocol-select"
                  value={manualProtocol}
                  onChange={e => setManualProtocol(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:border-indigo-500 outline-none"
                >
                  <option value="roku_ecp">Roku ECP (8060)</option>
                  <option value="samsung_tizen_ws">Samsung Tizen (8002)</option>
                  <option value="lg_webos_ssap">LG webOS (3001)</option>
                  <option value="sony_ircc_rest">Sony BRAVIA (80)</option>
                  <option value="android_tv_receiver">Android TV / Google TV (6467 / 6466)</option>
                  <option value="fire_tv">Amazon Fire TV (8008 / 5555)</option>
                  <option value="panasonic_viera">Panasonic VIERA (55000)</option>
                  <option value="philips_jointspace">Philips JointSpace (1925 / 1926)</option>
                  <option value="vizio_smartcast">Vizio SmartCast (7345 / 9000)</option>
                  <option value="apple_tv">Apple TV (7000)</option>
                  <option value="hisense_vidaa">Hisense VIDAA (3000)</option>
                  <option value="ir_universal">Consumer Infrared (IR 38kHz)</option>
                </select>
              </div>

              {(manualIp.trim() === "127.0.0.1" || manualIp.trim() === "localhost") && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Termux Localhost:</strong> 127.0.0.1 is the backend on your phone, not the TV. Please enter the TV's Wi-Fi LAN IP (e.g. 192.168.1.x) or use auto-scan.
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                {probeResult ? (
                  <span className="text-xs text-indigo-300 font-mono">{probeResult}</span>
                ) : <span />}
                <button
                  id="probe-ip-btn"
                  type="submit"
                  disabled={isScanning || !manualIp}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Probe TV
                </button>
              </div>
            </form>
          )}

          {/* List Cards */}
          {safeDeviceList.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3 bg-zinc-950/40 rounded-2xl border border-zinc-800/80">
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
                <Tv className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">No compatible TV found on this network.</p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Make sure your phone and Smart TV are connected to the same Wi-Fi network, or enter your TV's LAN IP address directly.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  id="empty-rescan-btn"
                  onClick={handleScan}
                  disabled={isScanning}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                  <span>Scan Again</span>
                </button>
                <button
                  id="empty-add-ip-btn"
                  onClick={() => setShowManualAdd(true)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Add TV by IP Address</span>
                </button>
              </div>
            </div>
          ) : (
            safeDeviceList.map(device => {
            const isSelected = device.id === currentDeviceId;
            return (
              <div
                key={device.id}
                id={`scanned-device-${device.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-indigo-950/20 border-indigo-500/50 shadow-md shadow-indigo-900/10"
                    : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-indigo-400 shrink-0">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-zinc-100 text-sm">{device.name}</h4>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-medium rounded-full">
                            Active
                          </span>
                        )}
                        {device.id === "atv_living_room_01" && (
                          <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Built-in Companion Receiver
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {device.model} • <span className="font-mono text-zinc-300">{device.ip}:{device.port}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[11px] text-zinc-500 font-medium">Protocol: {device.protocol}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          {device.requiresPairing ? (
                            device.isPaired ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Unlock className="w-3 h-3" /> Paired
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-400">
                                <Lock className="w-3 h-3" /> Pairing Required
                              </span>
                            )
                          ) : (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Unlock className="w-3 h-3" /> No Pairing Required
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {device.requiresPairing && !device.isPaired && onPairDevice && (
                      <button
                        id={`pair-btn-${device.id}`}
                        onClick={() => {
                          onPairDevice(device);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pair</span>
                      </button>
                    )}

                    <button
                      id={`select-btn-${device.id}`}
                      onClick={() => {
                        onSelectDevice?.(device);
                        onClose();
                      }}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                        isSelected
                          ? "bg-zinc-800 text-zinc-300 cursor-default"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      <span>{isSelected ? "Connected" : "Select TV"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capabilities preview */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
                  {(["power", "navigation", "volume", "media", "keyboard", "touchpad", "apps", "voice"] as const).map(cap => {
                    const status = device?.capabilities?.[cap] || "UNKNOWN";
                    const badge = getCapabilityBadgeColor(status);
                    return (
                      <span
                        key={cap}
                        className={`text-[10px] px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {CAPABILITY_LABELS[cap]}: {status.toLowerCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
          <span>Local network multi-protocol scan (SSDP / mDNS / HTTP)</span>
          <span>Offline local-first protocol execution</span>
        </div>
      </div>
    </div>
  );
};

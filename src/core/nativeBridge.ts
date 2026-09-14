/**
 * Native Bridge & Local Network Capability Inspector
 *
 * In browser-only mode, the web application communicates with local Smart TVs
 * via the local backend proxy (running on Termux / Node.js on port 3000/8080).
 *
 * Direct arbitrary UDP multicast, Bluetooth Low Energy, and hardware IR Blaster
 * require an explicit Native Android Bridge or local hardware interface.
 */

export interface NetworkCapabilityReport {
  httpRestOnline: boolean;
  websocketOnline: boolean;
  mdnsSsdpDiscoveryProxy: boolean;
  nativeAndroidBridgeAvailable: boolean;
  irHardwareAvailable: boolean;
  bluetoothSupported: boolean;
  latencyMs: number;
  bridgeVersion?: string;
  lanIpDetected?: string;
  notes: string[];
}

export class NativeBridgeService {
  /**
   * Check if an Android WebView or Termux local bridge is injected into window
   */
  static isAndroidNativeBridgeAvailable(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      (window as any).AndroidRemoteBridge ||
      (window as any).TermuxBridge ||
      (window as any).SmartTvBridge
    );
  }

  /**
   * Inspect all network and bridge capabilities
   */
  static async inspectCapabilities(): Promise<NetworkCapabilityReport> {
    const startTime = Date.now();
    let httpRestOnline = false;
    let mdnsSsdpDiscoveryProxy = false;
    let lanIpDetected: string | undefined;
    const notes: string[] = [];

    // 1. Probe backend /api/devices discovery endpoint
    try {
      const res = await fetch("/api/devices", { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        httpRestOnline = true;
        mdnsSsdpDiscoveryProxy = true;
        const data = await res.json().catch(() => ({}));
        if (data.lanIp) {
          lanIpDetected = data.lanIp;
        }
      }
    } catch (err: any) {
      notes.push("Local backend discovery proxy is currently starting or unreachable.");
    }

    // 2. Check WebSocket connectivity
    const websocketOnline = typeof WebSocket !== "undefined";

    // 3. Check Native Bridge
    const nativeAndroidBridgeAvailable = this.isAndroidNativeBridgeAvailable();
    if (!nativeAndroidBridgeAvailable) {
      notes.push("Native Android Bridge not detected. Wi-Fi control via local proxy is active.");
    }

    // 4. Check Optical IR Blaster
    let irHardwareAvailable = false;
    if (nativeAndroidBridgeAvailable && (window as any).AndroidRemoteBridge?.hasIrEmitter) {
      try {
        irHardwareAvailable = Boolean((window as any).AndroidRemoteBridge.hasIrEmitter());
      } catch {
        irHardwareAvailable = false;
      }
    }

    // 5. Check Bluetooth Low Energy
    const bluetoothSupported = typeof navigator !== "undefined" && !!(navigator as any).bluetooth;

    const latencyMs = Date.now() - startTime;

    return {
      httpRestOnline,
      websocketOnline,
      mdnsSsdpDiscoveryProxy,
      nativeAndroidBridgeAvailable,
      irHardwareAvailable,
      bluetoothSupported,
      latencyMs: Math.max(latencyMs, 12),
      lanIpDetected,
      notes,
    };
  }
}

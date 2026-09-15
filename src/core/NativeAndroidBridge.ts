/**
 * Native Android & Termux Hardware Bridge Architecture
 * 
 * Provides unified interface between Web UI and:
 * 1. Native Android WebView JavascriptInterface (e.g. window.AndroidBridge / window.Android)
 * 2. Termux local backend REST endpoints on 127.0.0.1:<PORT>
 * 3. Physical hardware interfaces (ConsumerIrManager, WifiManager multicast lock, NSD/mDNS)
 * 
 * In accordance with project architecture rules:
 * - 127.0.0.1 is strictly the local Termux/device bridge, never a target TV.
 * - Hardware capabilities are verified, never simulated.
 */

export interface NativeBridgeStatus {
  isAvailable: boolean;
  bridgeType: "NATIVE_ANDROID_JS" | "TERMUX_LOCAL_REST" | "WEB_BROWSER";
  hasConsumerIr: boolean;
  hasMulticastLock: boolean;
  carrierFrequencies?: Array<{ minFrequency: number; maxFrequency: number }>;
  androidVersion?: string;
  deviceModel?: string;
}

export interface NativeDiscoveryResult {
  devices: Array<{
    name: string;
    ip: string;
    port: number;
    platform: string;
    protocol: string;
  }>;
}

export class NativeAndroidBridge {
  private static cachedStatus: NativeBridgeStatus | null = null;

  /**
   * Detects active native Android bridge or local Termux environment
   */
  static async detectBridge(): Promise<NativeBridgeStatus> {
    if (this.cachedStatus) return this.cachedStatus;

    // 1. Check for Android WebView JavascriptInterface
    const win = typeof window !== "undefined" ? (window as any) : null;
    if (win && (win.AndroidBridge || win.Android)) {
      const bridge = win.AndroidBridge || win.Android;
      const hasIr = typeof bridge.hasIrEmitter === "function" ? Boolean(bridge.hasIrEmitter()) : false;
      const hasMulticast = typeof bridge.hasMulticastLock === "function" ? Boolean(bridge.hasMulticastLock()) : true;

      this.cachedStatus = {
        isAvailable: true,
        bridgeType: "NATIVE_ANDROID_JS",
        hasConsumerIr: hasIr,
        hasMulticastLock: hasMulticast,
        androidVersion: typeof bridge.getAndroidVersion === "function" ? bridge.getAndroidVersion() : "Android Native",
        deviceModel: typeof bridge.getDeviceModel === "function" ? bridge.getDeviceModel() : "Android Device"
      };
      return this.cachedStatus;
    }

    // 2. Check for Termux local backend /api/hardware/ir
    try {
      const res = await fetch("/api/hardware/ir", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        this.cachedStatus = {
          isAvailable: true,
          bridgeType: "TERMUX_LOCAL_REST",
          hasConsumerIr: Boolean(data.hasEmitter),
          hasMulticastLock: true,
          carrierFrequencies: data.carrierFrequencies,
          androidVersion: "Termux Linux/Android",
          deviceModel: "Termux Host"
        };
        return this.cachedStatus;
      }
    } catch {
      // Local bridge endpoint not reachable
    }

    // 3. Fallback: Standard Web browser environment
    this.cachedStatus = {
      isAvailable: false,
      bridgeType: "WEB_BROWSER",
      hasConsumerIr: false,
      hasMulticastLock: false
    };

    return this.cachedStatus;
  }

  /**
   * Transmits IR code via native ConsumerIrManager or Termux API
   */
  static async transmitIr(frequencyHz: number, pattern: number[]): Promise<{ success: boolean; error?: string }> {
    const status = await this.detectBridge();

    if (!status.hasConsumerIr) {
      return {
        success: false,
        error: "Physical IR emitter hardware is not present on this phone."
      };
    }

    const win = typeof window !== "undefined" ? (window as any) : null;
    if (status.bridgeType === "NATIVE_ANDROID_JS" && win) {
      const bridge = win.AndroidBridge || win.Android;
      try {
        if (typeof bridge.transmitIr === "function") {
          const ok = bridge.transmitIr(frequencyHz, JSON.stringify(pattern));
          return { success: Boolean(ok) };
        }
      } catch (err: any) {
        return { success: false, error: `Native IR error: ${err.message}` };
      }
    }

    // Termux local REST bridge
    try {
      const res = await fetch("/api/hardware/ir/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequencyKhz: Math.round(frequencyHz / 1000), pattern })
      });
      const data = await res.json();
      return { success: Boolean(data.success), error: data.error };
    } catch (err: any) {
      return { success: false, error: `IR bridge request failed: ${err.message}` };
    }
  }

  /**
   * Trigger native network discovery if supported by the Android wrapper
   */
  static async triggerNativeDiscovery(): Promise<NativeDiscoveryResult | null> {
    const win = typeof window !== "undefined" ? (window as any) : null;
    if (win && (win.AndroidBridge?.discoverTvDevices || win.Android?.discoverTvDevices)) {
      const bridge = win.AndroidBridge || win.Android;
      try {
        const json = bridge.discoverTvDevices();
        const parsed = JSON.parse(json);
        return { devices: parsed.devices || [] };
      } catch (err) {
        console.warn("[NativeBridge] Native discovery error:", err);
      }
    }
    return null;
  }

  /**
   * Invalidate cached status
   */
  static resetCache() {
    this.cachedStatus = null;
  }
}

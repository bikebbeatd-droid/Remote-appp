/**
 * Real Consumer Infrared (IR) Hardware Detection & Bridge Manager.
 *
 * Android APKs use the injected AndroidRemoteBridge directly so IR control
 * does not depend on an optional local HTTP server. Browser/Termux mode keeps
 * the HTTP fallback. No IR hardware is ever simulated.
 */

export interface IrHardwareStatus {
  hasEmitter: boolean;
  hasReceiver: boolean;
  carrierFrequencies?: Array<{ minFrequency: number; maxFrequency: number }>;
  bridgeSource?: "TERMUX_CONSUMER_IR" | "WEB_USB_TRANSCEIVER" | "NATIVE_ANDROID" | "NONE";
  statusMessage: string;
}

interface NativeIrBridge {
  hasIrEmitter?: () => boolean;
  transmitIr?: (carrierFrequency: number, patternCsv: string) => boolean;
}

function getNativeIrBridge(): NativeIrBridge | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as any).AndroidRemoteBridge;
  if (!bridge || typeof bridge.hasIrEmitter !== "function" || typeof bridge.transmitIr !== "function") {
    return null;
  }
  return bridge as NativeIrBridge;
}

export class IrHardwareManager {
  private static cachedStatus: IrHardwareStatus | null = null;

  static async checkHardware(): Promise<IrHardwareStatus> {
    if (this.cachedStatus) return this.cachedStatus;

    // Prefer the real Android ConsumerIrManager bridge in the APK.
    const nativeBridge = getNativeIrBridge();
    if (nativeBridge) {
      try {
        const hasEmitter = Boolean(nativeBridge.hasIrEmitter?.());
        this.cachedStatus = {
          hasEmitter,
          hasReceiver: false,
          carrierFrequencies: hasEmitter
            ? [{ minFrequency: 30000, maxFrequency: 60000 }]
            : undefined,
          bridgeSource: "NATIVE_ANDROID",
          statusMessage: hasEmitter
            ? "Built-in Android IR blaster detected and ready."
            : "This Android device does not report a built-in IR blaster."
        };
        return this.cachedStatus;
      } catch {
        // Fall through to the local HTTP bridge.
      }
    }

    // Browser/Termux fallback.
    try {
      const res = await fetch("/api/hardware/ir", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
          ? AbortSignal.timeout(2500)
          : undefined
      });

      if (res.ok) {
        const data = await res.json();
        this.cachedStatus = {
          hasEmitter: Boolean(data.hasEmitter),
          hasReceiver: Boolean(data.hasReceiver),
          carrierFrequencies: data.carrierFrequencies || [{ minFrequency: 30000, maxFrequency: 60000 }],
          bridgeSource: data.bridgeSource || "TERMUX_CONSUMER_IR",
          statusMessage: data.hasEmitter
            ? "Physical IR blaster detected through the local hardware bridge."
            : "IR hardware is not available on this device."
        };
        return this.cachedStatus;
      }
    } catch {
      // No local HTTP bridge; report the actual hardware state below.
    }

    this.cachedStatus = {
      hasEmitter: false,
      hasReceiver: false,
      bridgeSource: "NONE",
      statusMessage:
        "IR hardware is not available. A built-in IR blaster or compatible external transceiver is required."
    };
    return this.cachedStatus;
  }

  static async transmitPulse(
    frequencyKhz: number,
    pattern: number[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!Number.isFinite(frequencyKhz) || frequencyKhz <= 0) {
      return { success: false, error: "Invalid IR carrier frequency." };
    }
    if (!Array.isArray(pattern) || pattern.length === 0 || pattern.length > 1000) {
      return { success: false, error: "Invalid IR timing pattern." };
    }
    if (pattern.some(value => !Number.isFinite(value) || value <= 0 || value > 1000000)) {
      return { success: false, error: "IR timing pattern contains invalid pulse durations." };
    }

    const status = await this.checkHardware();
    if (!status.hasEmitter) {
      return {
        success: false,
        error: "No physical IR emitter is available on this device."
      };
    }

    // Native Android path: call ConsumerIrManager through MainActivity.java.
    const nativeBridge = getNativeIrBridge();
    if (nativeBridge?.transmitIr) {
      try {
        const ok = Boolean(
          nativeBridge.transmitIr(
            Math.round(frequencyKhz * 1000),
            pattern.map(value => Math.round(value)).join(",")
          )
        );
        return ok
          ? { success: true }
          : { success: false, error: "Android IR hardware rejected the transmission." };
      } catch (err: any) {
        return { success: false, error: err?.message || "Android IR transmission failed." };
      }
    }

    // Browser/Termux fallback.
    try {
      const res = await fetch("/api/hardware/ir/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequencyKhz, pattern }),
        signal: typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
          ? AbortSignal.timeout(5000)
          : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "IR pulse transmission failed." };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to reach the IR hardware bridge." };
    }
  }

  static async captureSignal(
    _timeoutMs = 10000
  ): Promise<{ success: boolean; code?: string; error?: string }> {
    const status = await this.checkHardware();
    if (!status.hasReceiver) {
      return {
        success: false,
        error: "IR learning is not available because this app has no verified IR receiver bridge."
      };
    }

    try {
      const res = await fetch("/api/hardware/ir/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeoutMs: _timeoutMs })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "IR signal capture failed." };
      }
      return { success: true, code: data.capturedCode };
    } catch (err: any) {
      return { success: false, error: err?.message || "IR learning failed." };
    }
  }

  static invalidateCache() {
    this.cachedStatus = null;
  }
}

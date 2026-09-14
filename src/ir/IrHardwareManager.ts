/**
 * Real Consumer Infrared (IR) Hardware Detection & Bridge Manager
 * 
 * Interacts with physical ConsumerIrManager (Android Termux / WebUSB / Native IR bridge).
 * Strictly detects hardware presence; NEVER fakes or simulates IR transmission if no emitter is found.
 */

export interface IrHardwareStatus {
  hasEmitter: boolean;
  hasReceiver: boolean; // For IR Learning
  carrierFrequencies?: Array<{ minFrequency: number; maxFrequency: number }>;
  bridgeSource?: "TERMUX_CONSUMER_IR" | "WEB_USB_TRANSCEIVER" | "NATIVE_ANDROID" | "NONE";
  statusMessage: string;
}

export class IrHardwareManager {
  private static cachedStatus: IrHardwareStatus | null = null;

  /**
   * Probes the runtime environment for physical IR emitter hardware
   */
  static async checkHardware(): Promise<IrHardwareStatus> {
    if (this.cachedStatus) return this.cachedStatus;

    try {
      // 1. Probe local Termux backend ConsumerIR bridge if present
      const res = await fetch("/api/hardware/ir", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const data = await res.json();
        this.cachedStatus = {
          hasEmitter: Boolean(data.hasEmitter),
          hasReceiver: Boolean(data.hasReceiver),
          carrierFrequencies: data.carrierFrequencies || [{ minFrequency: 30000, maxFrequency: 60000 }],
          bridgeSource: data.bridgeSource || "TERMUX_CONSUMER_IR",
          statusMessage: data.hasEmitter
            ? "Physical IR Blaster detected and ready via local Android hardware bridge."
            : "IR hardware not available on this phone."
        };
        return this.cachedStatus;
      }
    } catch {
      // Offline / no local hardware bridge running
    }

    // Default when running in standard web browser without IR emitter
    this.cachedStatus = {
      hasEmitter: false,
      hasReceiver: false,
      bridgeSource: "NONE",
      statusMessage: "IR hardware not available on this phone. A built-in IR blaster or USB transceiver is required for optical IR control."
    };

    return this.cachedStatus;
  }

  /**
   * Transmits real IR timing pulses. Returns failure immediately if no physical emitter exists.
   */
  static async transmitPulse(frequencyKhz: number, pattern: number[]): Promise<{ success: boolean; error?: string }> {
    const status = await this.checkHardware();
    if (!status.hasEmitter) {
      return {
        success: false,
        error: "IR hardware not available on this phone. Cannot transmit infrared optical pulse."
      };
    }

    try {
      const res = await fetch("/api/hardware/ir/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequencyKhz, pattern })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "IR pulse transmission failed." };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to reach IR blaster hardware." };
    }
  }

  /**
   * IR Learning mode to capture signal from physical remote
   */
  static async captureSignal(timeoutMs = 10000): Promise<{ success: boolean; code?: string; error?: string }> {
    const status = await this.checkHardware();
    if (!status.hasReceiver) {
      return {
        success: false,
        error: "IR learning receiver hardware is not available on this phone. Learning requires an IR receiver diode."
      };
    }

    try {
      const res = await fetch("/api/hardware/ir/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeoutMs })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "IR signal capture timed out." };
      }
      return { success: true, code: data.capturedCode };
    } catch (err: any) {
      return { success: false, error: err.message || "IR learning failed." };
    }
  }

  static invalidateCache() {
    this.cachedStatus = null;
  }
}

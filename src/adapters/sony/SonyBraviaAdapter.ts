import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class SonyBraviaAdapter implements TvAdapter {
  readonly platform = "sony_bravia";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "UNKNOWN",
      touchpad: "UNSUPPORTED", // Sony IRCC REST has no pointer protocol
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    };
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    const token = TokenVault.getToken(device.id) || device.token;

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value,
          token,
          protocol: "sony_ircc_rest"
        })
      });

      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok || !data.success) {
        return {
          success: false,
          command,
          value,
          timestamp: Date.now(),
          latencyMs,
          error: data.error || "Sony BRAVIA IRCC command delivery failed."
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "sony_ircc_rest"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Sony TV at ${device.ip}.`
      };
    }
  }

  async authenticate(
    device: TvDevice,
    pin: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch("/api/devices/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          pin,
          clientName: "Sony BRAVIA Remote"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Sony TV rejected pairing PIN." };
      }

      if (data.token) {
        TokenVault.saveToken(device.id, data.token);
      }

      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to pair with Sony BRAVIA TV." };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 80, protocol: "sony_ircc_rest" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

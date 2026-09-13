import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class SamsungTizenAdapter implements TvAdapter {
  readonly platform = "tizen";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED", // Tizen network protocol does not support microphone audio injection
      channels: "SUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "SUPPORTED",
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

    // Check voice rejection
    if (command === "VOICE_QUERY") {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs: 0,
        error: "Voice control is not supported by this TV."
      };
    }

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value,
          token,
          protocol: "samsung_tizen_ws"
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
          error: data.error || "Samsung Tizen SmartView command delivery failed."
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "samsung_tizen_ws"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Samsung TV at ${device.ip}:${device.port || 8002}.`
      };
    }
  }

  async authenticate(
    device: TvDevice,
    pin: string,
    clientName = "Universal Remote"
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch("/api/devices/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          pin,
          clientName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Samsung TV rejected pairing." };
      }

      if (data.token) {
        TokenVault.saveToken(device.id, data.token);
      }

      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to pair with Samsung TV." };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 8002, protocol: "samsung_tizen_ws" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

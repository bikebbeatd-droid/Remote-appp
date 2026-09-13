import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class AndroidTvAdapter implements TvAdapter {
  readonly platform = "android_tv";

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
      voice: "SUPPORTED",
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

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value,
          token,
          clientName: "Universal Smart Remote"
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
          error: data.error || `HTTP error ${res.status}: Failed to send command to Android TV.`
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "android_tv_receiver",
        rawPayload: data.tvState
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not connect to Android TV at ${device.ip}:${device.port}. Make sure device is powered on and connected to the same Wi-Fi network.`
      };
    }
  }

  async authenticate(
    device: TvDevice,
    pin: string,
    clientName = "Android Mobile Remote"
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
        return {
          success: false,
          error: data.error || "Incorrect pairing PIN. Verify code on TV screen."
        };
      }

      if (data.token) {
        TokenVault.saveToken(device.id, data.token);
      }

      return {
        success: true,
        token: data.token
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Network error during Android TV pairing."
      };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/receiver/state", { method: "GET" });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

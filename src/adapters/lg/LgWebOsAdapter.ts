import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class LgWebOsAdapter implements TvAdapter {
  readonly platform = "webos";

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
          protocol: "lg_webos_ssap"
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
          error: data.error || "LG webOS SSAP command execution failed."
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "lg_webos_ssap"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach LG webOS TV at ${device.ip}:${device.port || 3001}.`
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
        return { success: false, error: data.error || "LG webOS pairing rejected." };
      }

      if (data.token) {
        TokenVault.saveToken(device.id, data.token);
      }

      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to pair with LG TV." };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 3001, protocol: "lg_webos_ssap" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

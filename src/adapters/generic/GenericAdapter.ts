import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class FireTvAdapter implements TvAdapter {
  readonly platform = "fire_tv";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED",
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
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
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value,
          protocol: "fire_tv_dial"
        })
      });

      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        success: data.success,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "fire_tv_dial",
        error: data.error
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Fire TV at ${device.ip}.`
      };
    }
  }

  async authenticate(device: TvDevice): Promise<{ success: boolean; token?: string; error?: string }> {
    return { success: true, token: "fire_tv_open" };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return { online: true, latencyMs: 15 };
  }
}

export class GenericAdapter implements TvAdapter {
  readonly platform = "generic";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "UNKNOWN",
      touchpad: "UNSUPPORTED",
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
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value,
          protocol: "generic_http"
        })
      });
      const data = await res.json();
      return {
        success: data.success,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        protocol: "generic_http"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: err.message || "Failed to reach generic TV."
      };
    }
  }

  async authenticate(device: TvDevice): Promise<{ success: boolean; token?: string; error?: string }> {
    return { success: true, token: "generic_token" };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return { online: true, latencyMs: 20 };
  }
}

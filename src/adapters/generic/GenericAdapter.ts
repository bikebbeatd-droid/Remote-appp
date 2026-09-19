import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class FireTvAdapter implements TvAdapter {
  readonly platform = "fire_tv";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "UNKNOWN",
      navigation: "UNKNOWN",
      volume: "UNKNOWN",
      media: "UNKNOWN",
      keyboard: "UNKNOWN",
      touchpad: "UNKNOWN",
      apps: "UNKNOWN",
      input: "UNKNOWN",
      voice: "UNKNOWN",
      channels: "UNKNOWN",
      ir: "UNKNOWN",
      bluetooth: "UNKNOWN",
      wifi: "UNKNOWN"
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
    const probe = await this.ping(device);
    if (!probe.online) {
      return { success: false, error: probe.error || "Fire TV protocol could not be verified." };
    }
    return { success: true, token: "fire_tv_verified_probe" };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 8008, protocol: "fire_tv_dial" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

export class GenericAdapter implements TvAdapter {
  readonly platform = "generic";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "UNKNOWN",
      navigation: "UNKNOWN",
      volume: "UNKNOWN",
      media: "UNKNOWN",
      keyboard: "UNKNOWN",
      touchpad: "UNKNOWN",
      apps: "UNKNOWN",
      input: "UNKNOWN",
      voice: "UNKNOWN",
      channels: "UNKNOWN",
      ir: "UNKNOWN",
      bluetooth: "UNKNOWN",
      wifi: "UNKNOWN"
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
        protocol: "generic_http",
        error: data.error
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

  async authenticate(_device: TvDevice): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: false,
      error: "Generic TV control is disabled until a verified device protocol is identified."
    };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 80, protocol: "generic_http" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

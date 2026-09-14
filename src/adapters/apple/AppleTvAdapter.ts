import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class AppleTvAdapter implements TvAdapter {
  readonly platform = "apple_tv";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "SUPPORTED", // Apple TV remote protocol supports swipe/directional touchpad
      apps: "SUPPORTED",
      input: "UNSUPPORTED", // Apple TV is a streaming box, does not switch TV HDMI inputs
      voice: "SUPPORTED",
      channels: "UNSUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "SUPPORTED",
      wifi: "SUPPORTED"
    };
  }

  private mapAppleTvKey(command: RemoteCommandType): string | null {
    switch (command) {
      case "HOME": return "top_menu";
      case "BACK": return "menu";
      case "UP": return "up";
      case "DOWN": return "down";
      case "LEFT": return "left";
      case "RIGHT": return "right";
      case "OK": return "select";
      case "VOLUME_UP": return "volume_up";
      case "VOLUME_DOWN": return "volume_down";
      case "PLAY":
      case "PAUSE":
      case "PLAY_PAUSE": return "play_pause";
      case "STOP": return "stop";
      case "NEXT": return "next";
      case "PREVIOUS": return "previous";
      case "POWER": return "turn_off";
      default: return null;
    }
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    const token = TokenVault.getToken(device.id) || device.token;

    try {
      const appleKey = this.mapAppleTvKey(command);

      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          mappedKey: appleKey,
          value,
          token,
          protocol: "apple_companion_mrp"
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
          error: data.error || "Apple TV MediaRemote command failed."
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "apple_companion_mrp"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Apple TV at ${device.ip}:49152.`
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
          clientName,
          protocol: "apple_companion_mrp"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Apple TV rejected 4-digit pairing PIN." };
      }

      if (data.token) {
        TokenVault.saveToken(device.id, data.token);
      }

      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to pair with Apple TV." };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 49152, protocol: "apple_companion_mrp" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

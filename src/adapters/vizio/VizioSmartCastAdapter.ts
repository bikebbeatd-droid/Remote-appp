import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class VizioSmartCastAdapter implements TvAdapter {
  readonly platform = "vizio_smartcast";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    // Direct SmartCast transport is not implemented in this client yet.
    return {
      power: "UNKNOWN", navigation: "UNKNOWN", volume: "UNKNOWN", media: "UNKNOWN",
      keyboard: "UNKNOWN", touchpad: "UNSUPPORTED", apps: "UNKNOWN", input: "UNKNOWN",
      voice: "UNSUPPORTED", channels: "UNKNOWN", ir: "UNKNOWN",
      bluetooth: "UNKNOWN", wifi: "UNKNOWN"
    };
  }

  private mapVizioKey(command: RemoteCommandType): { type: number; code: number } | null {
    switch (command) {
      case "POWER": return { type: 11, code: 2 };
      case "HOME": return { type: 4, code: 3 };
      case "BACK": return { type: 4, code: 0 };
      case "MENU": return { type: 4, code: 8 };
      case "UP": return { type: 3, code: 8 };
      case "DOWN": return { type: 3, code: 0 };
      case "LEFT": return { type: 3, code: 1 };
      case "RIGHT": return { type: 3, code: 7 };
      case "OK": return { type: 3, code: 2 };
      case "VOLUME_UP": return { type: 5, code: 1 };
      case "VOLUME_DOWN": return { type: 5, code: 0 };
      case "MUTE": return { type: 5, code: 2 };
      case "PLAY": return { type: 2, code: 3 };
      case "PAUSE": return { type: 2, code: 2 };
      case "PLAY_PAUSE": return { type: 2, code: 1 };
      case "STOP": return { type: 2, code: 0 };
      case "REWIND": return { type: 2, code: 4 };
      case "FAST_FORWARD": return { type: 2, code: 5 };
      case "INPUT": return { type: 7, code: 1 };
      case "INFO": return { type: 4, code: 6 };
      case "GUIDE": return { type: 4, code: 5 };
      case "CHANNEL_UP": return { type: 8, code: 1 };
      case "CHANNEL_DOWN": return { type: 8, code: 0 };
      default: return null;
    }
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    return {
      success: false,
      command,
      value,
      timestamp: Date.now(),
      latencyMs: 0,
      error: "Vizio SmartCast direct transport is not yet verified in this build; backend-dependent control is disabled."
    };
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
          protocol: "vizio_smartcast_https"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Vizio SmartCast pairing PIN rejected." };
      }

      if (data.token) {
        TokenVault.saveToken(device.id, data.token);
      }

      return { success: true, token: data.token };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to pair with Vizio TV." };
    }
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      error: "Vizio SmartCast protocol verification requires a supported direct/native transport."
    };
  }
}

import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

/**
 * Roku ECP adapter.
 * Roku's External Control Protocol is a local HTTP interface on port 8060,
 * so the Android/WebView client can send keypresses directly to the Roku.
 */
export class RokuAdapter implements TvAdapter {
  readonly platform = "roku";

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
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    };
  }

  private mapRokuKey(command: RemoteCommandType): string | null {
    switch (command) {
      case "HOME": return "Home";
      case "BACK": return "Back";
      case "UP": return "Up";
      case "DOWN": return "Down";
      case "LEFT": return "Left";
      case "RIGHT": return "Right";
      case "OK": return "Select";
      case "VOLUME_UP": return "VolumeUp";
      case "VOLUME_DOWN": return "VolumeDown";
      case "MUTE": return "VolumeMute";
      case "PLAY":
      case "PAUSE":
      case "PLAY_PAUSE": return "Play";
      case "STOP": return "Stop";
      case "REWIND": return "Rev";
      case "FAST_FORWARD": return "Fwd";
      case "PREVIOUS": return "InstantReplay";
      case "NEXT": return "Fwd";
      case "POWER": return "Power";
      case "INPUT": return "InputTuner";
      case "INFO": return "Info";
      case "GUIDE": return "Guide";
      case "CHANNEL_UP": return "ChannelUp";
      case "CHANNEL_DOWN": return "ChannelDown";
      case "KEYBOARD_BACKSPACE": return "Backspace";
      case "KEYBOARD_ENTER": return "Enter";
      case "NUMBER_0": return "Lit_0";
      case "NUMBER_1": return "Lit_1";
      case "NUMBER_2": return "Lit_2";
      case "NUMBER_3": return "Lit_3";
      case "NUMBER_4": return "Lit_4";
      case "NUMBER_5": return "Lit_5";
      case "NUMBER_6": return "Lit_6";
      case "NUMBER_7": return "Lit_7";
      case "NUMBER_8": return "Lit_8";
      case "NUMBER_9": return "Lit_9";
      default: return null;
    }
  }

  private baseUrl(device: TvDevice): string {
    return `http://${device.ip}:${device.port || 8060}`;
  }

  private async directRequest(device: TvDevice, path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${this.baseUrl(device)}${path}`, {
      ...init,
      headers: {
        Accept: "application/xml, text/xml, */*",
        ...(init?.headers || {})
      }
    });
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();

    if (command === "TOUCHPAD_MOVE" || command === "TOUCHPAD_CLICK" || command === "VOICE_QUERY") {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: 0,
        error: "This Roku ECP transport does not implement pointer or voice-audio control."
      };
    }

    const mappedKey = this.mapRokuKey(command);
    if (!mappedKey) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: 0,
        error: `Roku ECP does not implement command ${command}.`
      };
    }

    try {
      const res = await this.directRequest(device, `/keypress/${encodeURIComponent(mappedKey)}`, { method: "POST" });
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        return {
          success: false,
          command,
          value,
          timestamp: Date.now(),
          latencyMs,
          error: `Roku rejected ${mappedKey} (HTTP ${res.status}). Enable Control by mobile apps on the Roku.`
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "roku_ecp_direct"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Roku at ${device.ip}:${device.port || 8060}: ${err?.message || "network error"}`
      };
    }
  }

  async authenticate(_device: TvDevice): Promise<{ success: boolean; token?: string; error?: string }> {
    return { success: true, token: "roku_ecp_open" };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await this.directRequest(device, "/query/device-info", { method: "GET" });
      const latencyMs = Math.round(performance.now() - start);
      return {
        online: res.ok,
        latencyMs,
        error: res.ok ? undefined : `Roku device-info request failed (HTTP ${res.status}).`
      };
    } catch (err: any) {
      return {
        online: false,
        latencyMs: Math.round(performance.now() - start),
        error: err?.message || "Roku is unreachable."
      };
    }
  }
}

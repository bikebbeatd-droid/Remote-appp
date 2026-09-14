import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

export class HisenseVidaaAdapter implements TvAdapter {
  readonly platform = "hisense_vidaa";

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

  private mapVidaaKey(command: RemoteCommandType): string | null {
    switch (command) {
      case "POWER": return "KEY_POWER";
      case "HOME": return "KEY_HOME";
      case "BACK": return "KEY_BACK";
      case "MENU": return "KEY_MENU";
      case "UP": return "KEY_UP";
      case "DOWN": return "KEY_DOWN";
      case "LEFT": return "KEY_LEFT";
      case "RIGHT": return "KEY_RIGHT";
      case "OK": return "KEY_OK";
      case "VOLUME_UP": return "KEY_VOLUMEUP";
      case "VOLUME_DOWN": return "KEY_VOLUMEDOWN";
      case "MUTE": return "KEY_MUTE";
      case "PLAY": return "KEY_PLAY";
      case "PAUSE": return "KEY_PAUSE";
      case "PLAY_PAUSE": return "KEY_PLAYPAUSE";
      case "STOP": return "KEY_STOP";
      case "REWIND": return "KEY_REWIND";
      case "FAST_FORWARD": return "KEY_FORWARDS";
      case "INPUT": return "KEY_INPUT";
      case "INFO": return "KEY_INFO";
      case "GUIDE": return "KEY_EPG";
      case "CHANNEL_UP": return "KEY_CHANNELUP";
      case "CHANNEL_DOWN": return "KEY_CHANNELDOWN";
      case "NUMBER_0": return "KEY_0";
      case "NUMBER_1": return "KEY_1";
      case "NUMBER_2": return "KEY_2";
      case "NUMBER_3": return "KEY_3";
      case "NUMBER_4": return "KEY_4";
      case "NUMBER_5": return "KEY_5";
      case "NUMBER_6": return "KEY_6";
      case "NUMBER_7": return "KEY_7";
      case "NUMBER_8": return "KEY_8";
      case "NUMBER_9": return "KEY_9";
      default: return null;
    }
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    const vidaaKey = this.mapVidaaKey(command);

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          mappedKey: vidaaKey,
          value,
          protocol: "hisense_vidaa_ws"
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
          error: data.error || "Hisense VIDAA WebSocket command failed."
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "hisense_vidaa_ws"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Hisense VIDAA TV at ${device.ip}:5757.`
      };
    }
  }

  async authenticate(
    device: TvDevice,
    pin: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: true,
      token: "hisense_vidaa_paired"
    };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 5757, protocol: "hisense_vidaa_ws" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

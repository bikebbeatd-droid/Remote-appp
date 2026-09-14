import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

export class PanasonicVieraAdapter implements TvAdapter {
  readonly platform = "panasonic_viera";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED", // Viera SOAP interface does not provide a mouse pointer stream
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "UNSUPPORTED",
      channels: "SUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    };
  }

  private mapVieraKey(command: RemoteCommandType): string | null {
    switch (command) {
      case "POWER": return "NRC_POWER-ONOFF";
      case "HOME": return "NRC_HOME-ONOFF";
      case "BACK": return "NRC_RETURN-ONOFF";
      case "MENU": return "NRC_MENU-ONOFF";
      case "UP": return "NRC_UP-ONOFF";
      case "DOWN": return "NRC_DOWN-ONOFF";
      case "LEFT": return "NRC_LEFT-ONOFF";
      case "RIGHT": return "NRC_RIGHT-ONOFF";
      case "OK": return "NRC_ENTER-ONOFF";
      case "VOLUME_UP": return "NRC_VOLUP-ONOFF";
      case "VOLUME_DOWN": return "NRC_VOLDOWN-ONOFF";
      case "MUTE": return "NRC_MUTE-ONOFF";
      case "PLAY": return "NRC_PLAY-ONOFF";
      case "PAUSE": return "NRC_PAUSE-ONOFF";
      case "STOP": return "NRC_STOP-ONOFF";
      case "REWIND": return "NRC_REW-ONOFF";
      case "FAST_FORWARD": return "NRC_FF-ONOFF";
      case "INPUT": return "NRC_CHG_INPUT-ONOFF";
      case "INFO": return "NRC_INFO-ONOFF";
      case "GUIDE": return "NRC_EPG-ONOFF";
      case "CHANNEL_UP": return "NRC_CH_UP-ONOFF";
      case "CHANNEL_DOWN": return "NRC_CH_DOWN-ONOFF";
      case "NUMBER_0": return "NRC_D0-ONOFF";
      case "NUMBER_1": return "NRC_D1-ONOFF";
      case "NUMBER_2": return "NRC_D2-ONOFF";
      case "NUMBER_3": return "NRC_D3-ONOFF";
      case "NUMBER_4": return "NRC_D4-ONOFF";
      case "NUMBER_5": return "NRC_D5-ONOFF";
      case "NUMBER_6": return "NRC_D6-ONOFF";
      case "NUMBER_7": return "NRC_D7-ONOFF";
      case "NUMBER_8": return "NRC_D8-ONOFF";
      case "NUMBER_9": return "NRC_D9-ONOFF";
      case "COLOR_RED": return "NRC_RED-ONOFF";
      case "COLOR_GREEN": return "NRC_GREEN-ONOFF";
      case "COLOR_YELLOW": return "NRC_YELLOW-ONOFF";
      case "COLOR_BLUE": return "NRC_BLUE-ONOFF";
      default: return null;
    }
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    const vieraKey = this.mapVieraKey(command);

    if (!vieraKey && command !== "TEXT_INPUT" && command !== "LAUNCH_APP") {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs: 0,
        error: `${command} is UNSUPPORTED on Panasonic VIERA network protocol.`
      };
    }

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          mappedKey: vieraKey,
          value,
          protocol: "panasonic_viera_rest"
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
          error: data.error || "Panasonic VIERA command execution failed. Ensure 'TV Remote App Control' is ON in TV Network Settings."
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "panasonic_viera_rest"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Panasonic VIERA at ${device.ip}:55000.`
      };
    }
  }

  async authenticate(
    device: TvDevice,
    pin: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: true,
      token: "viera_auth_open"
    };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch("/api/devices/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 55000, protocol: "panasonic_viera_rest" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}

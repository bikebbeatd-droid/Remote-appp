import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class AppleTvAdapter implements TvAdapter {
  readonly platform = "apple_tv";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    // Apple TV MRP transport is not implemented directly in this build.
    // Do not advertise capabilities that depend on the disabled backend transport.
    return {
      power: "UNKNOWN", navigation: "UNKNOWN", volume: "UNKNOWN", media: "UNKNOWN",
      keyboard: "UNKNOWN", touchpad: "UNKNOWN", apps: "UNKNOWN", input: "UNSUPPORTED",
      voice: "UNKNOWN", channels: "UNSUPPORTED", ir: "UNKNOWN",
      bluetooth: "UNKNOWN", wifi: "UNKNOWN"
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
    return {
      success: false,
      command,
      value,
      timestamp: Date.now(),
      latencyMs: 0,
      error: "Apple TV MRP direct transport is not yet verified in this build; backend-dependent control is disabled."
    };
  }

  async authenticate(
    _device: TvDevice,
    _pin: string,
    _clientName = "Universal Remote"
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: false,
      error: "Apple TV MRP pairing is not implemented; no fake authentication token is issued."
    };
  }
  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      error: "Apple TV MRP direct transport verification requires a supported native/local transport."
    };
  }
}

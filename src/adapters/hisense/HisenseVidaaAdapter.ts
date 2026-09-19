import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

export class HisenseVidaaAdapter implements TvAdapter {
  readonly platform = "hisense_vidaa";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    // VIDAA direct control is not verified in this build. Do not advertise
    // commands that currently depend on the backend simulation/transport.
    return {
      power: "UNKNOWN", navigation: "UNKNOWN", volume: "UNKNOWN", media: "UNKNOWN",
      keyboard: "UNKNOWN", touchpad: "UNSUPPORTED", apps: "UNKNOWN", input: "UNKNOWN",
      voice: "UNSUPPORTED", channels: "UNKNOWN", ir: "UNKNOWN",
      bluetooth: "UNKNOWN", wifi: "UNKNOWN"
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
    return {
      success: false,
      command,
      value,
      timestamp: Date.now(),
      latencyMs: 0,
      error: "Hisense VIDAA direct transport is not yet verified in this build; backend-dependent control is disabled."
    };
  }

  async authenticate(
    _device: TvDevice,
    _pin: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: false,
      error: "Hisense VIDAA pairing is not implemented; fake pairing tokens are disabled."
    };
  }
  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      error: "Hisense VIDAA direct protocol verification requires a supported native/local transport."
    };
  }
}

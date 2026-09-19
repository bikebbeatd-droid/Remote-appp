import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

export class PanasonicVieraAdapter implements TvAdapter {
  readonly platform = "panasonic_viera";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    // This adapter still routes through the app backend; direct VIERA transport
    // is not verified in the Android/WebView client.
    return {
      power: "UNKNOWN",
      navigation: "UNKNOWN",
      volume: "UNKNOWN",
      media: "UNKNOWN",
      keyboard: "UNKNOWN",
      touchpad: "UNSUPPORTED",
      apps: "UNKNOWN",
      input: "UNKNOWN",
      voice: "UNSUPPORTED",
      channels: "UNKNOWN",
      ir: "UNKNOWN",
      bluetooth: "UNKNOWN",
      wifi: "UNKNOWN"
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
    return {
      success: false,
      command,
      value,
      timestamp: Date.now(),
      latencyMs: 0,
      error: "Panasonic VIERA direct transport is not yet verified in this build; backend-dependent control is disabled."
    };
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
    return {
      online: false,
      error: "Panasonic VIERA protocol verification requires a supported direct/native transport."
    };
  }
}

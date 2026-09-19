import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

export class PhilipsJointSpaceAdapter implements TvAdapter {
  readonly platform = "philips";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    // The current app has no verified native/direct JointSpace transport for Philips.
    // Do not advertise backend-dependent commands as supported.
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

  private mapJointSpaceKey(command: RemoteCommandType): string | null {
    switch (command) {
      case "POWER": return "Standby";
      case "HOME": return "Home";
      case "BACK": return "Back";
      case "MENU": return "Options";
      case "UP": return "CursorUp";
      case "DOWN": return "CursorDown";
      case "LEFT": return "CursorLeft";
      case "RIGHT": return "CursorRight";
      case "OK": return "Confirm";
      case "VOLUME_UP": return "VolumeUp";
      case "VOLUME_DOWN": return "VolumeDown";
      case "MUTE": return "Mute";
      case "PLAY": return "Play";
      case "PAUSE": return "Pause";
      case "PLAY_PAUSE": return "PlayPause";
      case "STOP": return "Stop";
      case "REWIND": return "Rewind";
      case "FAST_FORWARD": return "FastForward";
      case "PREVIOUS": return "Previous";
      case "NEXT": return "Next";
      case "INPUT": return "Source";
      case "INFO": return "Info";
      case "GUIDE": return "TvGuide";
      case "CHANNEL_UP": return "ChannelStepUp";
      case "CHANNEL_DOWN": return "ChannelStepDown";
      case "NUMBER_0": return "Digit0";
      case "NUMBER_1": return "Digit1";
      case "NUMBER_2": return "Digit2";
      case "NUMBER_3": return "Digit3";
      case "NUMBER_4": return "Digit4";
      case "NUMBER_5": return "Digit5";
      case "NUMBER_6": return "Digit6";
      case "NUMBER_7": return "Digit7";
      case "NUMBER_8": return "Digit8";
      case "NUMBER_9": return "Digit9";
      case "COLOR_RED": return "RedColour";
      case "COLOR_GREEN": return "GreenColour";
      case "COLOR_YELLOW": return "YellowColour";
      case "COLOR_BLUE": return "BlueColour";
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
      error: "Philips JointSpace direct transport is not yet verified in this build; backend-dependent control is disabled."
    };
  }

  async authenticate(
    device: TvDevice,
    pin: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: true,
      token: "jointspace_open"
    };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      error: "Philips JointSpace protocol verification requires a supported direct/native transport."
    };
  }
}

import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

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
    _device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    return {
      success: false,
      command,
      value,
      timestamp: Date.now(),
      latencyMs: 0,
      protocol: "fire_tv_unverified",
      error: "Fire TV DIAL is discovery/app-launch oriented; no verified remote-key transport is implemented."
    };
  }

  async authenticate(_device: TvDevice): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: false,
      error: "Fire TV pairing is not implemented; no fake authentication token is issued."
    };
  }

  async ping(_device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      latencyMs: 0,
      error: "No verified Fire TV network protocol is available; probing is disabled."
    };
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
    _device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    return {
      success: false,
      command,
      value,
      timestamp: Date.now(),
      latencyMs: 0,
      protocol: "generic_unverified",
      error: "No verified network protocol is available for this TV."
    };
  }

  async authenticate(_device: TvDevice): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: false,
      error: "Generic TV control is disabled until a verified device protocol is identified."
    };
  }

  async ping(_device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      latencyMs: 0,
      error: "Generic TV transport is not verified; network probing is disabled."
    };
  }
}

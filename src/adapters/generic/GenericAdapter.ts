import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

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

  async authenticate(device: TvDevice): Promise<{ success: boolean; token?: string; error?: string }> {
    const probe = await this.ping(device);
    if (!probe.online) {
      return { success: false, error: probe.error || "Fire TV protocol could not be verified." };
    }
    return { success: true, token: "fire_tv_verified_probe" };
  }

  async ping(_device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      latencyMs: 0,
      error: "No verified generic network protocol is available; probing is disabled."
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
      error: "Fire TV remote control requires a verified transport or native bridge; DIAL alone is not sufficient."
    };
  }

  async ping(_device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      latencyMs: 0,
      error: "Fire TV remote transport is not verified; network probing is disabled."
    };
  }

import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";
import { TokenVault } from "../../pairing/tokenVault";

export class CompanionWebReceiverAdapter implements TvAdapter {
  readonly platform = "companion_web_receiver";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "REQUIRES_NATIVE_BRIDGE", navigation: "REQUIRES_NATIVE_BRIDGE",
      volume: "REQUIRES_NATIVE_BRIDGE", media: "REQUIRES_NATIVE_BRIDGE",
      keyboard: "REQUIRES_NATIVE_BRIDGE", touchpad: "REQUIRES_NATIVE_BRIDGE",
      apps: "REQUIRES_NATIVE_BRIDGE", input: "REQUIRES_NATIVE_BRIDGE",
      voice: "REQUIRES_NATIVE_BRIDGE", channels: "REQUIRES_NATIVE_BRIDGE",
      ir: "UNSUPPORTED", bluetooth: "UNKNOWN", wifi: "REQUIRES_NATIVE_BRIDGE"
    };
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value,
          protocol: "companion_ws",
          clientName: "Universal Mobile Remote"
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
          error: data.error || "Failed to execute command on TV Companion Receiver"
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "companion_ws"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach TV Companion Receiver: ${err.message}`
      };
    }
  }

  async authenticate(_device: TvDevice, _pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
    return {
      success: false,
      error: "Companion receiver pairing is not implemented in the verified local bridge."
    };
  }
  async ping(_device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    return {
      online: false,
      error: "Companion receiver requires an explicit native/local bridge; fake device online state is disabled."
    };
  }
  }
}

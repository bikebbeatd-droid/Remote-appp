import { TvAdapter } from "../types";
import { TvDevice, RemoteCommandType, CommandExecutionResult, DeviceCapabilities } from "../../core/types";

export class RokuAdapter implements TvAdapter {
  readonly platform = "roku";

  getCapabilities(_device?: TvDevice): DeviceCapabilities {
    return {
      power: "SUPPORTED",
      navigation: "SUPPORTED",
      volume: "SUPPORTED",
      media: "SUPPORTED",
      keyboard: "SUPPORTED",
      touchpad: "UNSUPPORTED", // Roku ECP does NOT have a pointer/touchpad protocol!
      apps: "SUPPORTED",
      input: "SUPPORTED",
      voice: "SUPPORTED",
      channels: "SUPPORTED",
      ir: "UNSUPPORTED",
      bluetooth: "UNSUPPORTED",
      wifi: "SUPPORTED"
    };
  }

  private mapRokuKey(command: RemoteCommandType, value?: any): string | null {
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
      case "REWIND": return "Rev";
      case "FAST_FORWARD": return "Fwd";
      case "POWER": return "Power";
      case "INPUT": return "InputTuner";
      case "INFO": return "Info";
      case "KEYBOARD_BACKSPACE": return "Backspace";
      case "KEYBOARD_ENTER": return "Enter";
      default: return null;
    }
  }

  async executeCommand(
    device: TvDevice,
    command: RemoteCommandType,
    value?: any
  ): Promise<CommandExecutionResult> {
    const startTime = performance.now();

    // Reject Touchpad honestly
    if (command === "TOUCHPAD_MOVE" || command === "TOUCHPAD_CLICK") {
      return {
        success: false,
        command,
        timestamp: Date.now(),
        latencyMs: 0,
        error: "Touchpad isn't supported by this TV."
      };
    }

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          value,
          protocol: "roku_ecp"
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
          error: data.error || "Roku ECP command execution failed"
        };
      }

      return {
        success: true,
        command,
        value,
        timestamp: Date.now(),
        latencyMs,
        protocol: "roku_ecp"
      };
    } catch (err: any) {
      return {
        success: false,
        command,
        value,
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - startTime),
        error: `Could not reach Roku at ${device.ip}:8060. Check Wi-Fi connection.`
      };
    }
  }

  async authenticate(
    device: TvDevice
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    // Roku ECP does not require authentication PIN
    return {
      success: true,
      token: "roku_ecp_open"
    };
  }

  async ping(device: TvDevice): Promise<{ online: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      // ECP ping to /query/device-info
      const res = await fetch(`/api/devices/probe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: device.ip, port: device.port || 8060, protocol: "roku_ecp" })
      });
      const latencyMs = Math.round(performance.now() - start);
      return { online: res.ok, latencyMs };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }
}
